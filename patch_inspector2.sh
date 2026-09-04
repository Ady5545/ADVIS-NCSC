sed -i 's/      {activeTab === '"'selection'"' && (/      {isEngineering ? (\n        <DigitalTwinInspector \n          objectId={primaryEngId as string} \n          selectedComponentId={selectedComponentId} \n          onSelectComponent={onSelectComponent} \n        />\n      ) : (\n        <>\n          {activeTab === '"'selection'"' \&\& (/g' src/UniversalScientificInspector.tsx

sed -i 's/      {isEngineering && selectedComp && (/\/\* {isEngineering \&\& selectedComp \&\& ( \*\//g' src/UniversalScientificInspector.tsx
sed -i 's/            <\/div>\n          )}\n          {\/\* Engineering: No component selected \*\//            <\/div>\n          )} \*\/\n          {\/\* Engineering: No component selected \*\//g' src/UniversalScientificInspector.tsx
sed -i 's/          {isEngineering && !selectedComp && (/\/\* {isEngineering \&\& !selectedComp \&\& ( \*\//g' src/UniversalScientificInspector.tsx
sed -i 's/            <\/div>\n          )}\n        <\/div>\n      )}/\n            <\/div>\n          )} \*\/\n        <\/div>\n      )}/g' src/UniversalScientificInspector.tsx

sed -i 's/          {isEngineering && engineeringMeta && (/\/\* {isEngineering \&\& engineeringMeta \&\& ( \*\//g' src/UniversalScientificInspector.tsx
sed -i 's/              <\/div>\n            <\/div>\n          )}\n        <\/div>\n      )}/\n              <\/div>\n            <\/div>\n          )} \*\/\n        <\/div>\n      )}/g' src/UniversalScientificInspector.tsx

sed -i 's/          {isEngineering && engineeringMeta?.educationalInformation && (/\/\* {isEngineering \&\& engineeringMeta?.educationalInformation \&\& ( \*\//g' src/UniversalScientificInspector.tsx
sed -i 's/              <\/p>\n            <\/div>\n          )}\n        <\/div>\n      )}/\n              <\/p>\n            <\/div>\n          )} \*\/\n        <\/div>\n      )}\n      <\/></g' src/UniversalScientificInspector.tsx
