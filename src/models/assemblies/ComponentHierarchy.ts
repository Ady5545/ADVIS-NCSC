import type { ComponentMetadata, ObjectMetadata } from '../../SpatialLibrary';

export interface ComponentTreeNode {
  id: string;
  label: string;
  kind: 'subsystem' | 'component';
  component?: ComponentMetadata;
  children: ComponentTreeNode[];
}

export interface HierarchyIssue {
  code: 'DUPLICATE_ID' | 'MISSING_PARENT' | 'SELF_PARENT' | 'CYCLE' | 'MISSING_CHILD' | 'PARENT_CHILD_MISMATCH';
  componentId: string;
  message: string;
}

/**
 * Produces a navigable tree from either a legacy flat component list or an explicitly
 * parented assembly. This is a view model only: it never mutates canonical metadata.
 */
export function buildComponentHierarchy(
  object: Pick<ObjectMetadata, 'components'>,
): ComponentTreeNode[] {
  const components = Array.isArray(object.components) ? object.components : [];
  const componentNodes = new Map<string, ComponentTreeNode>();
  const valid = components.filter((component) => component && component.id);

  for (const component of valid) {
    componentNodes.set(component.id, {
      id: component.id,
      label: component.name || component.id,
      kind: 'component',
      component,
      children: [],
    });
  }

  const childIds = new Set<string>();
  for (const component of valid) {
    if (!component.parentId || component.parentId === component.id) continue;
    const parent = componentNodes.get(component.parentId);
    const child = componentNodes.get(component.id);
    if (!parent || !child || childIds.has(component.id)) continue;
    parent.children.push(child);
    childIds.add(component.id);
  }

  const topLevelBySubsystem = new Map<string, ComponentTreeNode>();
  for (const component of valid) {
    if (childIds.has(component.id)) continue;
    const node = componentNodes.get(component.id);
    if (!node) continue;
    const subsystem = component.subsystemId || component.category || 'Components';
    let group = topLevelBySubsystem.get(subsystem);
    if (!group) {
      group = {
        id: `subsystem:${subsystem}`,
        label: subsystem.replace(/[_-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()),
        kind: 'subsystem',
        children: [],
      };
      topLevelBySubsystem.set(subsystem, group);
    }
    group.children.push(node);
  }

  const sortNodes = (nodes: ComponentTreeNode[]) => {
    nodes.sort((a, b) => a.label.localeCompare(b.label));
    nodes.forEach((node) => sortNodes(node.children));
  };
  const roots = [...topLevelBySubsystem.values()].filter((group) => group.children.length > 0);
  sortNodes(roots);
  return roots;
}

/** Validates hierarchy metadata without treating the legacy one-level catalog as invalid. */
export function validateComponentHierarchy(
  object: Pick<ObjectMetadata, 'components'>,
): HierarchyIssue[] {
  const components = Array.isArray(object.components) ? object.components : [];
  const counts = new Map<string, number>();
  for (const component of components) {
    if (component?.id) counts.set(component.id, (counts.get(component.id) || 0) + 1);
  }

  const ids = new Set(counts.keys());
  const issues: HierarchyIssue[] = [];
  for (const [id, count] of counts) {
    if (count > 1) issues.push({ code: 'DUPLICATE_ID', componentId: id, message: `Component id "${id}" occurs ${count} times.` });
  }

  const parentOf = new Map<string, string>();
  for (const component of components) {
    if (!component?.id) continue;
    if (component.parentId === component.id) {
      issues.push({ code: 'SELF_PARENT', componentId: component.id, message: 'A component cannot be its own parent.' });
    } else if (component.parentId && !ids.has(component.parentId)) {
      issues.push({ code: 'MISSING_PARENT', componentId: component.id, message: `Parent "${component.parentId}" does not exist in this assembly.` });
    } else if (component.parentId) {
      parentOf.set(component.id, component.parentId);
    }

    for (const childId of component.childrenIds || []) {
      if (!ids.has(childId)) {
        issues.push({ code: 'MISSING_CHILD', componentId: component.id, message: `Child "${childId}" does not exist in this assembly.` });
      } else {
        const child = components.find((candidate) => candidate?.id === childId);
        if (child && child.parentId && child.parentId !== component.id) {
          issues.push({ code: 'PARENT_CHILD_MISMATCH', componentId: component.id, message: `Child "${childId}" points to a different parent.` });
        }
      }
    }
  }

  const visited = new Set<string>();
  const complete = new Set<string>();
  const stack: string[] = [];
  const visit = (id: string) => {
    if (complete.has(id)) return;
    if (visited.has(id)) {
      const cycleStart = stack.indexOf(id);
      const cycle = cycleStart >= 0 ? stack.slice(cycleStart) : [id];
      for (const cycleId of cycle) {
        if (!issues.some((issue) => issue.code === 'CYCLE' && issue.componentId === cycleId)) {
          issues.push({ code: 'CYCLE', componentId: cycleId, message: `Parent relationships contain a cycle involving "${cycleId}".` });
        }
      }
      return;
    }
    visited.add(id);
    stack.push(id);
    const parent = parentOf.get(id);
    if (parent) visit(parent);
    stack.pop();
    complete.add(id);
  };
  ids.forEach(visit);
  return issues;
}
