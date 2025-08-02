const SHEET_ID = "15g0UFq0fLNbyORzKiITkLzlRduUSvi6TEFhVqoQOedM";
const sheetReady = "Sheet1";   // untuk ready stock
const sheetPreorder = "Sheet2"; // untuk preorder
const cart = JSON.parse(localStorage.getItem("cart")) || [];

async function fetchData(sheetName) {
  const url = `https://opensheet.elk.sh/${SHEET_ID}/${sheetName}`;
  const res = await fetch(url);
  return await res.json();
}

function formatRupiah(number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR"
  }).format(number);
}

function renderProductCard(product, isPreorder = false) {
  const card = document.createElement("div");
  card.className = "produk-card";

  const gambar = document.createElement("img");
  gambar.src = product.FotoURL;
  gambar.alt = product.Nama;

  const nama = document.createElement("h3");
  nama.textContent = product.Nama;

  const harga = document.createElement("p");
  harga.textContent = formatRupiah(parseInt(product.Harga));

  const deskripsi = document.createElement("p");
  deskripsi.textContent = product.Diskripsi;

  const stok = document.createElement("p");
  stok.textContent = isPreorder
    ? `Stok PO: ${product["Stok PO"] || "?"}`
    : `Stok: ${product.Stok || "?"}`;

  const kategori = document.createElement("p");
  kategori.className = "kategori";
  kategori.textContent = product.Kategori;

  const hariKirim = isPreorder && product["Hari kirim"]
    ? document.createElement("p")
    : null;
  if (hariKirim) {
    hariKirim.textContent = `Hari Kirim: ${product["Hari kirim"]}`;
  }

  const jumlahInput = document.createElement("input");
  jumlahInput.type = "number";
  jumlahInput.min = 1;
  jumlahInput.value = 1;

  const tambahBtn = document.createElement("button");
  tambahBtn.textContent = "Tambah ke Keranjang";
  tambahBtn.onclick = () => tambahKeKeranjang(product, jumlahInput.value);

  card.append(gambar, nama, harga, deskripsi, stok, kategori);
  if (hariKirim) card.append(hariKirim);
  card.append(jumlahInput, tambahBtn);
  return card;
}

function tampilkanProduk(list, isPreorder = false) {
  const container = document.getElementById("produk-container");
  container.innerHTML = "";
  list.forEach(p => {
    const card = renderProductCard(p, isPreorder);
    container.appendChild(card);
  });
}

function tambahKeKeranjang(produk, jumlah) {
  const existing = cart.find(item => item.SKU === produk.SKU);
  if (existing) {
    existing.jumlah += parseInt(jumlah);
  } else {
    cart.push({
      SKU: produk.SKU,
      Nama: produk.Nama,
      Harga: parseInt(produk.Harga),
      jumlah: parseInt(jumlah),
    });
  }
  localStorage.setItem("cart", JSON.stringify(cart));
  alert("Produk ditambahkan ke keranjang!");
  updateKeranjangIcon();
}

function updateKeranjangIcon() {
  const total = cart.reduce((sum, item) => sum + item.jumlah, 0);
  const ikon = document.getElementById("keranjang-icon");
  if (ikon) ikon.textContent = `🛒 (${total})`;
}

function setupSearchBar(allProducts, isPreorder = false) {
  const searchInput = document.getElementById("search-bar");
  if (!searchInput) return;

  searchInput.addEventListener("input", () => {
    const keyword = searchInput.value.toLowerCase();
    const filtered = allProducts.filter(p =>
      p.Nama.toLowerCase().includes(keyword) ||
      p.Kategori.toLowerCase().includes(keyword)
    );
    tampilkanProduk(filtered, isPreorder);
  });
}

function setupFilter(allProducts, isPreorder = false) {
  const kategoriSelect = document.getElementById("filter-kategori");
  const hariKirimSelect = document.getElementById("filter-hari");

  if (kategoriSelect) {
    kategoriSelect.addEventListener("change", () => {
      const kategori = kategoriSelect.value;
      const filtered = allProducts.filter(p =>
        (kategori === "semua" || p.Kategori === kategori)
      );
      tampilkanProduk(filtered, isPreorder);
    });
  }

  if (hariKirimSelect && isPreorder) {
    hariKirimSelect.addEventListener("change", () => {
      const hari = hariKirimSelect.value;
      const filtered = allProducts.filter(p =>
        (hari === "semua" || p["Hari kirim"] === hari)
      );
      tampilkanProduk(filtered, isPreorder);
    });
  }
}

async function loadReadyStock() {
  const data = await fetchData(sheetReady);
  const aktif = data.filter(p => p.Aktif?.toLowerCase() === "true");
  tampilkanProduk(aktif, false);
  setupSearchBar(aktif);
  setupFilter(aktif, false);
  updateKeranjangIcon();
}

async function loadPreorder() {
  const data = await fetchData(sheetPreorder);
  const aktif = data.filter(p => p.Aktif?.toLowerCase() === "true");
  tampilkanProduk(aktif, true);
  setupSearchBar(aktif, true);
  setupFilter(aktif, true);
  updateKeranjangIcon();
}

// Untuk halaman qris/keranjang
function tampilkanKeranjang() {
  const container = document.getElementById("keranjang-container");
  const totalEl = document.getElementById("total-harga");
  if (!container || !totalEl) return;

  container.innerHTML = "";
  let total = 0;

  cart.forEach(item => {
    const div = document.createElement("div");
    div.className = "keranjang-item";
    div.innerHTML = `
      <span>${item.Nama} (${item.jumlah})</span>
      <span>${formatRupiah(item.Harga * item.jumlah)}</span>
    `;
    total += item.Harga * item.jumlah;
    container.appendChild(div);
  });

  totalEl.textContent = formatRupiah(total);
}

function clearKeranjang() {
  localStorage.removeItem("cart");
  alert("Keranjang dikosongkan!");
  location.reload();
}
