sed -i 's/{isEngineeringActive && engineeringData && (/{isEngineeringActive \&\& engineeringDatas.length > 0 \&\& (\n            <div className="space-y-4">\n              {engineeringDatas.map((engineeringData, idx) => (/g' src/ScientificHUD.tsx

sed -i 's/<\/div>\n            <\/div>\n          )}\n          {\/\* IDLE \/ NO ACTIVE MODEL STATE \*\//<\/div>\n            <\/div>\n            ))}\n            <\/div>\n          )}\n          {\/\* IDLE \/ NO ACTIVE MODEL STATE \*\//g' src/ScientificHUD.tsx
