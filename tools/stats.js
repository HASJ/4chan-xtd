fetch('https://api.github.com/repos/TuxedoTako/4chan-xt/releases').then(async res => {
  const data = await res.json();
  for (const row of data) {
    console.log(row.name);
    console.table(row.assets.map(a => ({
      name: a.name,
      "download count": a.download_count
    })))
  }
});