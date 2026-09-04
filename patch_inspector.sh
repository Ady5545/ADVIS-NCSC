# First, add the import to UniversalScientificInspector.tsx
sed -i 's/import { CHEMISTRY_DATABASE, ChemicalEntity } from ".\/LearnEngine\/ChemistryDatabase";/import { CHEMISTRY_DATABASE, ChemicalEntity } from ".\/LearnEngine\/ChemistryDatabase";\nimport { DigitalTwinInspector } from ".\/DigitalTwinInspector";/g' src/UniversalScientificInspector.tsx

# Then find where we render the engineering parts and replace them or adjust tabs.
