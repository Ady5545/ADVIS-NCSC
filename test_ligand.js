const ligands = undefined;
try {
  console.log(ligands?.map(l => l).join(', '));
} catch (e) {
  console.log(e.message);
}
