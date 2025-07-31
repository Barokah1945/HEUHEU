
const sheetId = "15g0UFq0fLNbyORzKiITkLzlRduUSvi6TEFhVqoQOedM";
const sheetReadyGid = "1044556738";
const sheetPreorderGid = "0";

const getSheetURL = (isPreorder) => {
  const gid = isPreorder ? sheetPreorderGid : sheetReadyGid;
  return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&gid=${gid}`;
};

async function fetchProducts() {
  const res = await fetch(getSheetURL(isPreorder));
  const text = await res.text();
  const json = JSON.parse(text.substr(47).slice(0, -2));
  const rows = json.table.rows;
  const headers = json.table.cols.map(c => c.label.toLowerCase());

  const products = rows.map(row => {
    const item = {};
    headers.forEach((h, i) => {
      item[h] = row.c[i] ? row.c[i].v : "";
    });
    return item;
  });

  return products.filter(p => p["aktif"] && p["aktif"].toString().toLowerCase() === "true");
}

function renderProducts(products) {
  const container = document.getElementById("product-list");
  container.innerHTML = "";

  const kategoriSet = new Set();
  const hariSet = new Set();

  products.forEach((p, i) => {
    const el = document.createElement("div");
    el.className = "product";
    el.innerHTML = `
      <img src="${p.gambar}" alt="${p.nama}" />
      <h3>${p.nama}</h3>
      <p>Harga: Rp ${p.harga}</p>
      ${isPreorder ? `<p>Hari Kirim: ${p.hari_kirim}</p>` : ""}
      <input type="number" min="1" value="1" id="qty-${i}" />
      <button onclick="addToCart(${i})">Tambah</button>
    `;
    container.appendChild(el);

    kategoriSet.add(p.kategori);
    hariSet.add(p.hari_kirim);
  });

  if (isPreorder) {
    populateFilter("filter-kategori", kategoriSet);
    populateFilter("filter-hari", hariSet);
  }

  window.products = products;
}

function populateFilter(id, values) {
  const el = document.getElementById(id);
  values.forEach(v => {
    const opt = document.createElement("option");
    opt.value = v;
    opt.textContent = v;
    el.appendChild(opt);
  });

  el.addEventListener("change", () => {
    const filtered = window.products.filter(p => {
      const kategoriMatch = document.getElementById("filter-kategori").value === "" || p.kategori === document.getElementById("filter-kategori").value;
      const hariMatch = document.getElementById("filter-hari").value === "" || p.hari_kirim === document.getElementById("filter-hari").value;
      return kategoriMatch && hariMatch;
    });
    renderProducts(filtered);
  });
}

const cart = [];

function addToCart(index) {
  const qty = parseInt(document.getElementById(`qty-${index}`).value);
  if (qty <= 0) return;
  const p = window.products[index];
  cart.push({ ...p, qty });
  updateCart();
}

function updateCart() {
  const el = document.getElementById("cart");
  if (cart.length === 0) {
    el.innerHTML = "<p>Keranjang kosong</p>";
    return;
  }

  let html = "<h3>Keranjang</h3><ul>";
  cart.forEach((item, i) => {
    html += `<li>${item.nama} x ${item.qty}</li>`;
  });
  html += "</ul>";

  html += `
    <button onclick="checkoutWA()">Konfirmasi WA</button>
    <a href="qris.html"><button>Bayar QRIS</button></a>
  `;

  el.innerHTML = html;
}

function checkoutWA() {
  const items = cart.map(item => `${item.nama} x ${item.qty}`).join("%0A");
  const message = `Halo, saya ingin pesan:%0A${items}`;
  window.open(`https://wa.me/?text=${message}`, "_blank");
}

fetchProducts().then(renderProducts);
