sed -i 's/const isEngineeringActive = !!activeSpatialObject && !activeLearningSession;/const isEngineeringActive = !!activeSpatialObject \&\& !activeLearningSession;\n  const activeSpatialObjectsArray = Array.isArray(activeSpatialObject) ? activeSpatialObject : (activeSpatialObject ? [activeSpatialObject] : []);\n  const engineeringDatas: ObjectMetadata[] = activeSpatialObjectsArray.map(id => SPATIAL_LIBRARY[id]).filter(Boolean);/g' src/ScientificHUD.tsx

sed -i 's/const primaryEngineeringId = Array.isArray(activeSpatialObject) ? activeSpatialObject\[0\] : activeSpatialObject;//g' src/ScientificHUD.tsx
sed -i 's/const engineeringData: ObjectMetadata | null = primaryEngineeringId ? (SPATIAL_LIBRARY\[primaryEngineeringId\] || null) : null;//g' src/ScientificHUD.tsx
sed -i 's/const activeKey = moleculeKey || primaryEngineeringId || null;/const activeKey = moleculeKey || activeSpatialObjectsArray[0] || null;/g' src/ScientificHUD.tsx

sed -i 's/const selectedComp: ComponentMetadata | null = (engineeringData && selectedComponentId)/let selectedComp: ComponentMetadata | null = null;\n  if (selectedComponentId) {\n    for (const ed of engineeringDatas) {\n      const comp = ed.components.find(c => c.id === selectedComponentId);\n      if (comp) { selectedComp = comp; break; }\n    }\n  }\n  \/\/ (false \&\& selectedComponentId)/g' src/ScientificHUD.tsx

