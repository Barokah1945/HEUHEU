const sheetID = "15g0UFq0fLNbyORzKiITkLzlRduUSvi6TEFhVqoQOedM";
const sheetGIDs = {
  ready: "1044556738",      // Sheet1
  preorder: "1798429486"    // Sheet2
};

let cart = JSON.parse(localStorage.getItem("cart")) || [];

function loadProducts(mode = "ready") {
  const gid = sheetGIDs[mode];
  const url = `https://docs.google.com/spreadsheets/d/${sheetID}/gviz/tq?tqx=out:json&gid=${gid}`;
  fetch(url)
    .then(res => res.text())
    .then(data => {
      const json = JSON.parse(data.substr(47).slice(0, -2));
      const headers = json.table.cols.map(col => col.label);
      const rows = json.table.rows.map(row =>
        row.c.reduce((obj, cell, i) => {
          obj[headers[i]] = cell ? cell.v : "";
          return obj;
        }, {})
      );
      const aktifRows = rows.filter(row => row["Aktif"] === true || row["Aktif"] === "TRUE");
      displayProducts(aktifRows, mode);
      initFilters(aktifRows, mode);
    });
}

function displayProducts(products, mode) {
  const container = document.getElementById("product-list");
  container.innerHTML = "";
  const keyword = (document.getElementById("searchInput")?.value || "").toLowerCase();
  const kategoriFilter = document.getElementById("filterKategori")?.value || "";
  const hariFilter = document.getElementById("filterHari")?.value || "";

  const filtered = products.filter(p => {
    const nameMatch = p.Nama?.toLowerCase().includes(keyword);
    const kategoriMatch = kategoriFilter ? p.Kategori === kategoriFilter : true;
    const hariMatch = hariFilter ? p["Hari kirim"] === hariFilter : true;
    return nameMatch && kategoriMatch && hariMatch;
  });

  for (const p of filtered) {
    const div = document.createElement("div");
    div.className = "product";
    div.innerHTML = `
      <img src="${p.FotoURL}" alt="${p.Nama}" />
      <div class="product-info">
        <h3>${p.Nama}</h3>
        <p>${p.Diskripsi}</p>
        <p class="price">Rp ${formatRupiah(p.Harga)}</p>
        <button onclick="addToCart('${p.SKU}', '${p.Nama}', ${p.Harga}, '${mode}')">+ Keranjang</button>
      </div>
    `;
    container.appendChild(div);
  }
}

function formatRupiah(angka) {
  return parseInt(angka).toLocaleString("id-ID");
}

function addToCart(sku, nama, harga, mode) {
  const existing = cart.find(item => item.sku === sku && item.mode === mode);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ sku, nama, harga, qty: 1, mode });
  }
  localStorage.setItem("cart", JSON.stringify(cart));
  alert("Produk ditambahkan ke keranjang");
}

function initFilters(data, mode) {
  if (mode === "preorder") {
    const kategori = [...new Set(data.map(p => p.Kategori).filter(Boolean))];
    const hari = [...new Set(data.map(p => p["Hari kirim"]).filter(Boolean))];

    const kategoriSelect = document.getElementById("filterKategori");
    const hariSelect = document.getElementById("filterHari");

    kategoriSelect.innerHTML = '<option value="">Semua Kategori</option>' +
      kategori.map(k => `<option value="${k}">${k}</option>`).join("");
    hariSelect.innerHTML = '<option value="">Semua Hari Kirim</option>' +
      hari.map(h => `<option value="${h}">${h}</option>`).join("");

    kategoriSelect.onchange = () => displayProducts(data, mode);
    hariSelect.onchange = () => displayProducts(data, mode);
  }

  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.oninput = () => displayProducts(data, mode);
  }
}
