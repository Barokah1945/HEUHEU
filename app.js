// === KONFIGURASI GOOGLE SHEETS ===
const SHEET_ID = '15g0UFq0fLNbyORzKiITkLzlRduUSvi6TEFhVqoQOedM';
const READY_STOCK_SHEET = 'Sheet1';
const PREORDER_SHEET = 'Sheet2';
const SHEETS_API = 'https://opensheet.elk.sh';

// === DOM ELEMEN ===
const produkContainer = document.getElementById('produk-container');
const kategoriFilter = document.getElementById('kategori-filter');
const hariKirimFilter = document.getElementById('hari-filter');
const searchInput = document.getElementById('search-input');

let semuaProduk = [];
let keranjang = JSON.parse(localStorage.getItem('keranjang')) || [];

// === LOAD PRODUK ===
async function loadProduk(sheetName, mode = 'ready') {
  const url = `${SHEETS_API}/${SHEET_ID}/${sheetName}`;
  const res = await fetch(url);
  const data = await res.json();

  // Filter berdasarkan "Aktif"
  semuaProduk = data.filter(p => p.Aktif.toLowerCase() === 'true');

  tampilkanFilterKategori();
  tampilkanProduk(semuaProduk, mode);
}

// === TAMPILKAN PRODUK ===
function tampilkanProduk(data, mode) {
  produkContainer.innerHTML = '';

  data.forEach(item => {
    const card = document.createElement('div');
    card.className = 'produk-card';

    const hargaFormat = parseInt(item.Harga).toLocaleString('id-ID');

    card.innerHTML = `
      <img src="${item.FotoURL}" alt="${item.Nama}" onerror="this.src='img/noimage.jpg'">
      <h3>${item.Nama}</h3>
      <p>${item.Diskripsi || ''}</p>
      <p class="harga">Rp ${hargaFormat}</p>
      ${mode === 'preorder' ? `<p><strong>Hari Kirim:</strong> ${item['Hari kirim']}</p>` : ''}
      <div class="input-beli">
        <input type="number" min="1" value="1" id="qty-${item.SKU}" />
        <button onclick="tambahKeKeranjang('${item.SKU}', '${item.Nama}', ${item.Harga}, '${mode}')">+ Keranjang</button>
      </div>
    `;

    produkContainer.appendChild(card);
  });
}

// === TAMPILKAN FILTER KATEGORI ===
function tampilkanFilterKategori() {
  const kategoriUnik = [...new Set(semuaProduk.map(p => p.Kategori))];

  kategoriFilter.innerHTML = `
    <option value="">Semua Kategori</option>
    ${kategoriUnik.map(k => `<option value="${k}">${k}</option>`).join('')}
  `;
}

// === FILTER PRODUK ===
kategoriFilter?.addEventListener('change', filterProduk);
hariKirimFilter?.addEventListener('change', filterProduk);
searchInput?.addEventListener('input', filterProduk);

function filterProduk() {
  const kategori = kategoriFilter?.value;
  const hari = hariKirimFilter?.value?.toLowerCase();
  const cari = searchInput?.value?.toLowerCase();

  let hasil = semuaProduk.filter(p =>
    (!kategori || p.Kategori === kategori) &&
    (!hari || p['Hari kirim']?.toLowerCase() === hari) &&
    (!cari || p.Nama?.toLowerCase().includes(cari))
  );

  const mode = window.location.pathname.includes('preorder') ? 'preorder' : 'ready';
  tampilkanProduk(hasil, mode);
}

// === KERANJANG ===
function tambahKeKeranjang(sku, nama, harga, mode) {
  const qty = parseInt(document.getElementById(`qty-${sku}`).value);
  const index = keranjang.findIndex(item => item.sku === sku);

  if (index > -1) {
    keranjang[index].qty += qty;
  } else {
    keranjang.push({ sku, nama, harga, qty, mode });
  }

  localStorage.setItem('keranjang', JSON.stringify(keranjang));
  alert(`Ditambahkan ke keranjang: ${nama}`);
}

// === KERANJANG PAGE ===
function tampilkanKeranjang() {
  const keranjangList = document.getElementById('keranjang-list');
  const totalElem = document.getElementById('total-harga');
  const qrisBtn = document.getElementById('qris-btn');
  const waBtn = document.getElementById('wa-btn');

  if (!keranjangList) return;

  keranjangList.innerHTML = '';
  let total = 0;

  keranjang.forEach(item => {
    const subtotal = item.harga * item.qty;
    total += subtotal;

    const li = document.createElement('li');
    li.innerHTML = `
      ${item.nama} (${item.qty} x Rp ${item.harga.toLocaleString()}) = Rp ${subtotal.toLocaleString()}
      <button onclick="hapusItem('${item.sku}')">X</button>
    `;
    keranjangList.appendChild(li);
  });

  totalElem.textContent = `Total: Rp ${total.toLocaleString()}`;

  // Buat teks untuk WA
  const teksWA = keranjang.map(i =>
    `- ${i.nama} (${i.qty}x): Rp ${(i.harga * i.qty).toLocaleString()}`
  ).join('\n');

  const pesan = `Halo, saya ingin pesan:\n${teksWA}\nTotal: Rp ${total.toLocaleString()}`;
  const encoded = encodeURIComponent(pesan);

  waBtn.href = `https://wa.me/6281234567890?text=${encoded}`;
}

// === HAPUS ITEM ===
function hapusItem(sku) {
  keranjang = keranjang.filter(i => i.sku !== sku);
  localStorage.setItem('keranjang', JSON.stringify(keranjang));
  tampilkanKeranjang();
}

// === INISIALISASI ===
document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.includes('preorder')) {
    loadProduk(PREORDER_SHEET, 'preorder');
  } else if (window.location.pathname.includes('index') || window.location.pathname === '/') {
    loadProduk(READY_STOCK_SHEET, 'ready');
  }

  if (document.getElementById('keranjang-list')) {
    tampilkanKeranjang();
  }
});
