/**
 * Compatibility helpers for moving the flat SpatialLibrary catalog toward a
 * real assembly tree. Legacy components without parentId/childrenIds remain
 * valid and are represented as top-level siblings.
 */
export interface HierarchyComponentLike {
  id: string;
  name: string;
  parentId?: string | null;
  childrenIds?: string[];
}

export interface ComponentHierarchyNode<T extends HierarchyComponentLike> {
  component: T;
  children: ComponentHierarchyNode<T>[];
}

export interface HierarchyIssue {
  code: 'DUPLICATE_ID' | 'MISSING_PARENT' | 'MISSING_CHILD' | 'MULTIPLE_PARENTS' | 'PARENT_CHILD_CONFLICT' | 'CYCLE';
  componentId: string;
  message: string;
}

export interface ComponentHierarchyResult<T extends HierarchyComponentLike> {
  roots: ComponentHierarchyNode<T>[];
  byId: Map<string, T>;
  issues: HierarchyIssue[];
}

export function buildComponentHierarchy<T extends HierarchyComponentLike>(
  components: readonly T[]
): ComponentHierarchyResult<T> {
  const byId = new Map<string, T>();
  const issues: HierarchyIssue[] = [];

  for (const component of components) {
    if (byId.has(component.id)) {
      issues.push({
        code: 'DUPLICATE_ID',
        componentId: component.id,
        message: `Component id "${component.id}" is duplicated in the same model.`,
      });
      continue;
    }
    byId.set(component.id, component);
  }

  const parentById = new Map<string, string>();
  for (const component of byId.values()) {
    if (component.parentId) {
      if (!byId.has(component.parentId)) {
        issues.push({
          code: 'MISSING_PARENT',
          componentId: component.id,
          message: `Parent "${component.parentId}" does not exist in this model.`,
        });
      } else {
        parentById.set(component.id, component.parentId);
      }
    }
  }

  for (const parent of byId.values()) {
    for (const childId of parent.childrenIds || []) {
      if (!byId.has(childId)) {
        issues.push({
          code: 'MISSING_CHILD',
          componentId: parent.id,
          message: `Child "${childId}" does not exist in this model.`,
        });
        continue;
      }

      const declaredParent = parentById.get(childId);
      if (declaredParent && declaredParent !== parent.id) {
        issues.push({
          code: 'PARENT_CHILD_CONFLICT',
          componentId: childId,
          message: `Parent "${declaredParent}" conflicts with "${parent.id}" listing this component as a child.`,
        });
      } else if (!declaredParent) {
        parentById.set(childId, parent.id);
      }
    }
  }

  const childrenByParent = new Map<string, string[]>();
  for (const [childId, parentId] of parentById) {
    const siblings = childrenByParent.get(parentId) || [];
    siblings.push(childId);
    childrenByParent.set(parentId, siblings);
  }

  // A parent cycle makes the hierarchy impossible to render as a tree.
  const visitState = new Map<string, 'visiting' | 'visited'>();
  const visit = (id: string, chain: string[]) => {
    if (visitState.get(id) === 'visited') return;
    if (visitState.get(id) === 'visiting') {
      issues.push({
        code: 'CYCLE',
        componentId: id,
        message: `Hierarchy cycle detected: ${[...chain, id].join(' → ')}.`,
      });
      return;
    }
    visitState.set(id, 'visiting');
    const parentId = parentById.get(id);
    if (parentId) visit(parentId, [...chain, id]);
    visitState.set(id, 'visited');
  };
  for (const id of byId.keys()) visit(id, []);

  const buildNode = (id: string, ancestors: Set<string>): ComponentHierarchyNode<T> => {
    const component = byId.get(id)!;
    if (ancestors.has(id)) return { component, children: [] };
    const nextAncestors = new Set(ancestors);
    nextAncestors.add(id);
    const childIds = childrenByParent.get(id) || [];
    return {
      component,
      children: childIds
        .filter((childId) => !nextAncestors.has(childId))
        .map((childId) => buildNode(childId, nextAncestors)),
    };
  };

  let rootIds = [...byId.keys()].filter((id) => !parentById.has(id));
  // Keep a broken/cyclic catalog inspectable instead of returning a blank tree.
  if (rootIds.length === 0 && byId.size > 0) rootIds = [...byId.keys()];

  return {
    roots: rootIds.map((id) => buildNode(id, new Set())),
    byId,
    issues,
  };
}

export function validateComponentHierarchy<T extends HierarchyComponentLike>(
  components: readonly T[]
): HierarchyIssue[] {
  return buildComponentHierarchy(components).issues;
}
