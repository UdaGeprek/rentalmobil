// ============================================
// GLOBAL VARIABLES
// ============================================
let supabase;

// ============================================
// WAIT FOR DOM & LIBRARIES
// ============================================
window.addEventListener('DOMContentLoaded', function() {
    console.log('🔄 DOM loaded, checking libraries...');
    
    let retryCount = 0;
    const maxRetries = 10;
    
    const checkLibraries = setInterval(function() {
        retryCount++;
        console.log(`🔍 Checking libraries... (attempt ${retryCount}/${maxRetries})`);
        
        if (typeof window.supabase === 'undefined' || typeof CryptoJS === 'undefined') {
            console.warn(`⚠️ Libraries belum load (attempt ${retryCount})`);
            if (retryCount >= maxRetries) {
                clearInterval(checkLibraries);
                console.error('❌ FATAL: Libraries tidak bisa load!');
                alert('ERROR: Supabase/CryptoJS library gagal load!');
            }
            return;
        }
        
        clearInterval(checkLibraries);
        console.log('✅ All libraries loaded!');
        initializeApp();
    }, 200);
});

// ============================================
// INITIALIZE APP
// ============================================
function initializeApp() {
    console.log('🚀 Initializing app...');
    
    const SUPABASE_URL = 'https://shnzpvacqcmkycdmdlaw.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNobnpwdmFjcWNta3ljZG1kbGF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1NDE2MjYsImV4cCI6MjA4NDExNzYyNn0.bUn14JOIO6uSkrwHkjRh4arjfZrDlSSLbf1l_c3HVZI';
    
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase initialized');
    
    setupEventListeners();
    checkSession();
}

// ============================================
// EVENT LISTENERS
// ============================================
function setupEventListeners() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Image upload preview
    const imageInput = document.getElementById('carImageInput');
    if (imageInput) {
        imageInput.addEventListener('change', handleImagePreview);
    }
    
    // Save Car button
    const saveCarBtn = document.getElementById('saveCarBtn');
    if (saveCarBtn) {
        saveCarBtn.addEventListener('click', saveCar);
    }
    
    // Save Customer button
    const saveCustomerBtn = document.getElementById('saveCustomerBtn');
    if (saveCustomerBtn) {
        saveCustomerBtn.addEventListener('click', saveCustomer);
    }
    
    // Save Rental button
    const saveRentalBtn = document.getElementById('saveRentalBtn');
    if (saveRentalBtn) {
        saveRentalBtn.addEventListener('click', saveRental);
    }
    
    // Expose functions to global scope
    window.showPage = showPage;
    window.logout = logout;
    window.startEditCustomer = startEditCustomer;
    window.startEditCar = startEditCar;
    window.startCreateRental = startCreateRental;
    window.completeRental = completeRental;
    window.saveCustomer = saveCustomer;
    window.saveCar = saveCar;
    window.saveRental = saveRental;
}

// ============================================
// AUTH: LOGIN
// ============================================
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const errorMsg = document.getElementById('loginError');
    const btn = e.target.querySelector('button[type="submit"]');
    
    try {
        btn.disabled = true;
        btn.textContent = 'MEMPROSES...';
        errorMsg.style.display = 'none';
        
        const hashedPassword = CryptoJS.SHA256(password).toString();
        console.log('🔐 Login attempt:', email);
        
        const { data, error } = await supabase
            .from('admin')
            .select('*')
            .eq('email', email)
            .eq('password', hashedPassword)
            .single();
        
        if (error || !data) {
            throw new Error('Email atau kata sandi salah!');
        }
        
        console.log('✅ Login berhasil:', data);
        
        localStorage.setItem('admin_session', JSON.stringify({
            id: data.id,
            email: data.email,
            nama: data.nama,
            loginTime: new Date().toISOString()
        }));
        
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
        
        updateUserInfo(data);
        await loadAllData();
        showPage('dashboard');
        
    } catch (err) {
        console.error('❌ Login failed:', err);
        errorMsg.textContent = err.message || 'Email atau kata sandi salah!';
        errorMsg.style.display = 'block';
    } finally {
        btn.disabled = false;
        btn.textContent = 'MASUK';
    }
}

// ============================================
// AUTH: CHECK SESSION
// ============================================
async function checkSession() {
    const raw = localStorage.getItem('admin_session');
    if (!raw) return;
    
    try {
        const admin = JSON.parse(raw);
        console.log('✅ Session ditemukan:', admin);
        
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
        
        updateUserInfo(admin);
        await loadAllData();
        showPage('dashboard');
    } catch (e) {
        console.error('❌ Invalid session:', e);
        localStorage.removeItem('admin_session');
    }
}

// ============================================
// AUTH: LOGOUT
// ============================================
function logout() {
    localStorage.removeItem('admin_session');
    document.getElementById('mainApp').style.display = 'none';
    document.getElementById('loginPage').style.display = 'flex';
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
    console.log('✅ Logout berhasil');
}

// ============================================
// UI: UPDATE USER INFO
// ============================================
function updateUserInfo(admin) {
    const avatar = document.querySelector('.user-avatar');
    const nameEl = document.querySelector('.user-details h6');
    
    if (avatar && admin && admin.nama) {
        avatar.textContent = admin.nama.charAt(0).toUpperCase();
    }
    
    if (nameEl && admin && admin.nama) {
        nameEl.textContent = admin.nama;
    }
}

// ============================================
// UI: SHOW PAGE
// ============================================
function showPage(pageName, element) {
    document.querySelectorAll('[id^="page-"]').forEach(p => {
        p.style.display = 'none';
    });
    
    const page = document.getElementById(`page-${pageName}`);
    if (page) {
        page.style.display = 'block';
    }
    
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    if (element) {
        element.classList.add('active');
    }
    
    const titles = {
        'dashboard': 'Dashboard',
        'cars': 'Data Mobil',
        'customers': 'Data Pelanggan',
        'rentals': 'Data Penyewaan',
        'returns': 'Pengembalian',
        'transactions': 'Keuangan'
    };
    
    const titleEl = document.getElementById('pageTitle');
    if (titleEl && titles[pageName]) {
        titleEl.textContent = titles[pageName];
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================
function avatarFromName(name) {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function formatCurrency(num) {
    return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
}

function formatDateRange(start, end) {
    if (!start || !end) return '-';
    const s = new Date(start);
    const e = new Date(end);
    const opts = { day: '2-digit', month: 'short' };
    return `${s.toLocaleDateString('id-ID', opts)} - ${e.toLocaleDateString('id-ID', opts)}`;
}

// ============================================
// IMAGE UPLOAD: PREVIEW
// ============================================
function handleImagePreview(event) {
    const file = event.target.files[0];
    const preview = document.getElementById('imagePreview');
    const previewContainer = document.getElementById('imagePreviewContainer');
    
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            previewContainer.style.display = 'block';
        };
        reader.readAsDataURL(file);
    } else {
        previewContainer.style.display = 'none';
    }
}

// ============================================
// IMAGE UPLOAD: TO SUPABASE STORAGE
// ============================================
async function uploadCarImage(file, carId) {
    try {
        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            throw new Error('Ukuran file terlalu besar! Maksimal 2MB');
        }
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
            throw new Error('File harus berupa gambar!');
        }
        
        const fileExt = file.name.split('.').pop();
        const fileName = `${carId}_${Date.now()}.${fileExt}`;
        const filePath = `car-images/${fileName}`;
        
        console.log('📤 Uploading to:', filePath);
        
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('mobil-images')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });
        
        if (uploadError) {
            console.error('❌ Upload error:', uploadError);
            throw uploadError;
        }
        
        const { data: publicData } = supabase.storage
            .from('mobil-images')
            .getPublicUrl(filePath);
        
        console.log('✅ Image URL:', publicData.publicUrl);
        return publicData.publicUrl;
        
    } catch (err) {
        console.error('❌ Upload failed:', err);
        throw new Error('Gagal upload gambar: ' + err.message);
    }
}

// ============================================
// LOAD ALL DATA
// ============================================
async function loadAllData() {
    await Promise.all([
        loadDashboard(),
        loadCustomers(),
        loadCars(),
        loadRentals()
    ]);
}

// ============================================
// DASHBOARD
// ============================================
async function loadDashboard() {
    try {
        const [carsRes, rentalsRes] = await Promise.all([
            supabase.from('mobil').select('id, status'),
            supabase.from('penyewaan').select('id, totalharga, status')
        ]);

        const cars = carsRes.data || [];
        const rentals = rentalsRes.data || [];

        const totalMobil = cars.length;
        const tersedia = cars.filter(c => c.status === 'tersedia').length;
        const disewa = cars.filter(c => c.status === 'disewa').length;
        
        const pendapatan = rentals
            .filter(r => r.status === 'Selesai' || r.status === 'Sedang Berlangsung')
            .reduce((sum, r) => sum + (Number(r.totalharga) || 0), 0);

        const stats = document.querySelectorAll('.stat-card .stat-info h3');
        if (stats[0]) stats[0].textContent = totalMobil;
        if (stats[1]) stats[1].textContent = tersedia;
        if (stats[2]) stats[2].textContent = disewa;
        if (stats[3]) stats[3].textContent = formatCurrency(pendapatan);

        console.log('✅ Dashboard loaded');
    } catch (err) {
        console.error('❌ Load dashboard error:', err);
    }
}

// ============================================
// CRUD: PELANGGAN
// ============================================
async function loadCustomers() {
    try {
        const { data, error } = await supabase
            .from('pelanggan')
            .select('*')
            .order('kode_pelanggan');
        
        if (error) throw error;
        
        const tbody = document.querySelector('#page-customers table tbody');
        if (!tbody) return;
        
        tbody.innerHTML = (data || []).map(p => `
            <tr>
                <td><strong>${p.kode_pelanggan}</strong></td>
                <td>
                    <div class="table-user">
                        <div class="table-user-avatar">${avatarFromName(p.nama)}</div>
                        <span>${p.nama}</span>
                    </div>
                </td>
                <td>${p.nik}</td>
                <td>${p.telepon}</td>
                <td>
                    <span class="badge-status ${p.status === 'aktif' ? 'badge-active' : 'badge-inactive'}">
                        ${p.status}
                    </span>
                </td>
                <td>
                    <button class="btn btn-outline btn-sm" onclick="startEditCustomer('${p.id}')">Edit</button>
                    <button class="btn btn-primary btn-sm" onclick="showPage('rentals')">Sewa</button>
                </td>
            </tr>
        `).join('');
        
        console.log('✅ Customers loaded:', data.length);
    } catch (err) {
        console.error('❌ Load customers error:', err);
    }
}

async function startEditCustomer(id) {
    try {
        const { data, error } = await supabase
            .from('pelanggan')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error || !data) {
            alert('Data pelanggan tidak ditemukan!');
            return;
        }
        
        const modal = document.getElementById('customerModal');
        modal.dataset.editId = data.id;
        modal.querySelector('.modal-title').textContent = 'Edit Pelanggan';
        
        document.getElementById('customerNIK').value = data.nik;
        document.getElementById('customerNama').value = data.nama;
        document.getElementById('customerTelepon').value = data.telepon;
        
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    } catch (err) {
        console.error('❌ Edit customer error:', err);
        alert('Gagal load data pelanggan!');
    }
}

async function saveCustomer() {
    try {
        const modal = document.getElementById('customerModal');
        const editId = modal.dataset.editId;
        
        const nik = document.getElementById('customerNIK')?.value.trim();
        const nama = document.getElementById('customerNama')?.value.trim();
        const telepon = document.getElementById('customerTelepon')?.value.trim();
        
        if (!nik || !nama || !telepon) {
            alert('Lengkapi semua data pelanggan!');
            return;
        }
        
        if (editId) {
            const { error } = await supabase
                .from('pelanggan')
                .update({ nik, nama, telepon })
                .eq('id', editId);
            
            if (error) throw error;
        } else {
            const { data: lastCust } = await supabase
                .from('pelanggan')
                .select('kode_pelanggan')
                .order('kode_pelanggan', { ascending: false })
                .limit(1)
                .single();
            
            const lastNum = lastCust ? parseInt(lastCust.kode_pelanggan.slice(3)) : 0;
            const kode = 'CST' + String(lastNum + 1).padStart(3, '0');
            
            const { error } = await supabase
                .from('pelanggan')
                .insert({
                    kode_pelanggan: kode,
                    nik,
                    nama,
                    telepon,
                    status: 'aktif'
                });
            
            if (error) throw error;
        }
        
        const bsModal = bootstrap.Modal.getInstance(modal);
        if (bsModal) bsModal.hide();
        
        delete modal.dataset.editId;
        document.getElementById('customerForm').reset();
        
        await loadCustomers();
        alert('✅ Pelanggan berhasil disimpan!');
        
        console.log('✅ Customer saved');
    } catch (err) {
        console.error('❌ Save customer error:', err);
        alert('Gagal simpan pelanggan: ' + err.message);
    }
}

// ============================================
// CRUD: MOBIL (WITH IMAGE UPLOAD)
// ============================================
async function loadCars() {
    try {
        const { data, error } = await supabase
            .from('mobil')
            .select('*')
            .order('nama');
        
        if (error) throw error;
        
        const container = document.querySelector('#page-cars .row');
        if (!container) return;
        
        container.innerHTML = (data || []).map(m => `
            <div class="col-md-4">
                <div class="car-card">
                    <div class="car-image" style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)">
                        ${m.image_url 
                            ? `<img src="${m.image_url}" alt="${m.nama}" style="width: 90%; height: auto; object-fit: contain; filter: drop-shadow(0 10px 20px rgba(0,0,0,0.4));">`
                            : `<div style="padding: 60px; text-align: center; color: #fff; opacity: 0.5;">📷 No Image</div>`
                        }
                        <span class="car-status ${m.status === 'tersedia' ? 'badge-available' : 'badge-rented'}">
                            ${m.status === 'tersedia' ? 'Tersedia' : 'Disewa'}
                        </span>
                    </div>
                    <div class="car-info">
                        <div class="car-title">${m.nama}</div>
                        <div class="car-plate">${m.plat_nomor}</div>
                        <div class="car-specs">
                            <div class="spec-item">${m.kursi} Kursi</div>
                            <div class="spec-item">${m.transmisi}</div>
                            <div class="spec-item">${m.bahanbakar}</div>
                        </div>
                    </div>
                    <div class="car-price">
                        ${formatCurrency(m.hargaperhari)} <span>/hari</span>
                    </div>
                    <div class="car-actions">
                        <button class="btn btn-outline btn-sm" onclick="startEditCar('${m.id}')">Edit</button>
                        ${m.status === 'tersedia' 
                            ? `<button class="btn btn-primary btn-sm" onclick="showPage('rentals')">Sewa</button>`
                            : `<button class="btn btn-success btn-sm" onclick="showPage('returns')">Kembali</button>`
                        }
                    </div>
                </div>
            </div>
        `).join('');
        
        console.log('✅ Cars loaded:', data.length);
    } catch (err) {
        console.error('❌ Load cars error:', err);
    }
}

async function startEditCar(id) {
    try {
        const { data, error } = await supabase
            .from('mobil')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error || !data) {
            alert('Data mobil tidak ditemukan!');
            return;
        }
        
        const modal = document.getElementById('carModal');
        modal.dataset.editId = data.id;
        modal.querySelector('.modal-title').textContent = 'Edit Mobil';
        
        // Split nama jadi merek dan model
        const namaParts = data.nama.split(' ');
        const merek = namaParts[0];
        const model = namaParts.slice(1).join(' ');
        
        document.getElementById('carMerek').value = merek;
        document.getElementById('carModel').value = model;
        document.getElementById('carPlat').value = data.plat_nomor;
        document.getElementById('carKursi').value = data.kursi;
        document.getElementById('carTransmisi').value = data.transmisi;
        document.getElementById('carBahanBakar').value = data.bahanbakar;
        document.getElementById('carHarga').value = data.hargaperhari;
        
        // Show current image if exists
        const preview = document.getElementById('imagePreview');
        const previewContainer = document.getElementById('imagePreviewContainer');
        if (data.image_url && preview) {
            preview.src = data.image_url;
            previewContainer.style.display = 'block';
        }
        
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    } catch (err) {
        console.error('❌ Edit car error:', err);
        alert('Gagal load data mobil!');
    }
}

async function saveCar() {
    try {
        const modal = document.getElementById('carModal');
        const editId = modal.dataset.editId;
        
        // Get all values
        const merek = document.getElementById('carMerek')?.value || '';
        const model = document.getElementById('carModel')?.value.trim();
        const plat = document.getElementById('carPlat')?.value.trim();
        const kursi = parseInt(document.getElementById('carKursi')?.value, 10) || 5;
        const transmisi = document.getElementById('carTransmisi')?.value || 'Automatic';
        const bahanbakar = document.getElementById('carBahanBakar')?.value || 'Bensin';
        const harga = parseInt(document.getElementById('carHarga')?.value, 10);
        const imageFile = document.getElementById('carImageInput')?.files[0];
        
        console.log('📝 Form data:', { merek, model, plat, kursi, transmisi, bahanbakar, harga });
        
        // Validation
        if (!model || !plat || !harga) {
            alert('❌ Lengkapi data: Model, Plat Nomor, dan Harga wajib diisi!');
            return;
        }
        
        if (harga < 50000) {
            alert('❌ Harga minimal Rp 50.000!');
            return;
        }
        
        // Prepare payload
        const nama = merek ? `${merek} ${model}` : model;
        const payload = {
            nama: nama,
            plat_nomor: plat.toUpperCase(),
            kursi: kursi,
            transmisi: transmisi,
            bahanbakar: bahanbakar,
            hargaperhari: harga
        };
        
        console.log('💾 Payload:', payload);
        
        let carId = editId;
        
        // Insert or Update
        if (editId) {
            console.log('🔄 Updating car:', editId);
            const { error } = await supabase
                .from('mobil')
                .update(payload)
                .eq('id', editId);
            
            if (error) throw error;
            console.log('✅ Car updated');
        } else {
            console.log('➕ Inserting new car');
            const { data: newCar, error } = await supabase
                .from('mobil')
                .insert({
                    ...payload,
                    status: 'tersedia'
                })
                .select()
                .single();
            
            if (error) throw error;
            carId = newCar.id;
            console.log('✅ Car inserted:', carId);
        }
        
        // Upload image if provided
        if (imageFile && carId) {
            try {
                console.log('📤 Uploading image...');
                const imageUrl = await uploadCarImage(imageFile, carId);
                console.log('✅ Image uploaded:', imageUrl);
                
                // Update car with image URL
                await supabase
                    .from('mobil')
                    .update({ image_url: imageUrl })
                    .eq('id', carId);
                
            } catch (imgErr) {
                console.error('⚠️ Image upload failed:', imgErr);
                alert('⚠️ Mobil tersimpan, tapi gagal upload gambar: ' + imgErr.message);
            }
        }
        
        // Close modal and refresh
        const bsModal = bootstrap.Modal.getInstance(modal);
        if (bsModal) bsModal.hide();
        
        delete modal.dataset.editId;
        document.getElementById('carForm').reset();
        document.getElementById('imagePreviewContainer').style.display = 'none';
        
        await loadCars();
        await loadDashboard();
        
        alert('✅ Mobil berhasil disimpan!');
        console.log('✅ Save car completed');
        
    } catch (err) {
        console.error('❌ Save car error:', err);
        alert('❌ Gagal simpan mobil: ' + err.message);
    }
}

// ============================================
// CRUD: PENYEWAAN
// ============================================
async function loadRentals() {
    try {
        const { data, error } = await supabase
            .from('penyewaan')
            .select(`
                id,
                invoice,
                tanggalsewa,
                tanggalkembali,
                totalharga,
                status,
                pelanggan:pelangganid(nama),
                mobil:mobilid(nama)
            `)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const tbody = document.querySelector('#page-rentals table tbody');
        if (!tbody) return;
        
        tbody.innerHTML = (data || []).map(r => `
            <tr>
                <td><strong>${r.invoice}</strong></td>
                <td>${r.pelanggan?.nama || '-'}</td>
                <td>${r.mobil?.nama || '-'}</td>
                <td>${formatDateRange(r.tanggalsewa, r.tanggalkembali)}</td>
                <td><strong>${formatCurrency(r.totalharga)}</strong></td>
                <td>
                    <span class="badge-status ${r.status === 'Sedang Berlangsung' ? 'badge-ongoing' : 'badge-completed'}">
                        ${r.status}
                    </span>
                </td>
                <td>
                    <button class="btn btn-outline btn-sm">Detail</button>
                    ${r.status === 'Sedang Berlangsung' 
                        ? `<button class="btn btn-success btn-sm" onclick="completeRental('${r.id}')">Kembali</button>`
                        : ''
                    }
                </td>
            </tr>
        `).join('');
        
        console.log('✅ Rentals loaded:', data.length);
    } catch (err) {
        console.error('❌ Load rentals error:', err);
    }
}

async function startCreateRental() {
    try {
        const [custRes, carRes] = await Promise.all([
            supabase.from('pelanggan').select('id, nama').eq('status', 'aktif'),
            supabase.from('mobil').select('id, nama, hargaperhari').eq('status', 'tersedia')
        ]);
        
        const modal = document.getElementById('rentalModal');
        const customerSelect = document.getElementById('rentalCustomer');
        const carSelect = document.getElementById('rentalCar');
        
        if (customerSelect) {
            customerSelect.innerHTML = '<option value="">Pilih Pelanggan</option>' + 
                (custRes.data || []).map(c => 
                    `<option value="${c.id}">${c.nama}</option>`
                ).join('');
        }
        
        if (carSelect) {
            carSelect.innerHTML = '<option value="">Pilih Mobil</option>' +
                (carRes.data || []).map(c => 
                    `<option value="${c.id}" data-harga="${c.hargaperhari}">${c.nama} - ${formatCurrency(c.hargaperhari)}/hari</option>`
                ).join('');
        }
        
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    } catch (err) {
        console.error('❌ Start create rental error:', err);
    }
}

async function saveRental() {
    try {
        const modal = document.getElementById('rentalModal');
        
        const pelangganId = document.getElementById('rentalCustomer')?.value;
        const mobilId = document.getElementById('rentalCar')?.value;
        const tanggalSewa = document.getElementById('rentalStartDate')?.value;
        const tanggalKembali = document.getElementById('rentalEndDate')?.value;
        
        if (!pelangganId || !mobilId || !tanggalSewa || !tanggalKembali) {
            alert('Lengkapi semua data penyewaan!');
            return;
        }
        
        const days = Math.max(1, Math.ceil((new Date(tanggalKembali) - new Date(tanggalSewa)) / (1000*60*60*24)));
        const carSelect = document.getElementById('rentalCar');
        const harga = parseInt(carSelect.selectedOptions[0].dataset.harga, 10);
        const total = days * harga;
        
        const now = new Date();
        const dateStr = now.toISOString().slice(0,10).replace(/-/g, '');
        
        const { data: lastInv } = await supabase
            .from('penyewaan')
            .select('invoice')
            .like('invoice', `INV-${dateStr}%`)
            .order('invoice', { ascending: false })
            .limit(1)
            .single();
        
        const lastNum = lastInv ? parseInt(lastInv.invoice.split('-').pop()) : 0;
        const invoice = `INV-${dateStr}-${String(lastNum + 1).padStart(4, '0')}`;
        
        const { error } = await supabase
            .from('penyewaan')
            .insert({
                invoice,
                pelangganid: pelangganId,
                mobilid: mobilId,
                tanggalsewa: tanggalSewa,
                tanggalkembali: tanggalKembali,
                totalharga: total,
                status: 'Sedang Berlangsung'
            });
        
        if (error) throw error;
        
        await supabase
            .from('mobil')
            .update({ status: 'disewa' })
            .eq('id', mobilId);
        
        const bsModal = bootstrap.Modal.getInstance(modal);
        if (bsModal) bsModal.hide();
        
        document.getElementById('rentalForm').reset();
        
        await loadRentals();
        await loadCars();
        await loadDashboard();
        
        alert('✅ Penyewaan berhasil dibuat!');
        console.log('✅ Rental created');
    } catch (err) {
        console.error('❌ Save rental error:', err);
        alert('Gagal simpan penyewaan: ' + err.message);
    }
}

async function completeRental(id) {
    if (!confirm('Konfirmasi pengembalian mobil?')) return;
    
    try {
        const { data: rental } = await supabase
            .from('penyewaan')
            .select('mobilid')
            .eq('id', id)
            .single();
        
        await supabase
            .from('penyewaan')
            .update({ status: 'Selesai' })
            .eq('id', id);
        
        await supabase
            .from('mobil')
            .update({ status: 'tersedia' })
            .eq('id', rental.mobilid);
        
        await loadRentals();
        await loadCars();
        await loadDashboard();
        
        alert('✅ Pengembalian berhasil!');
        console.log('✅ Rental completed');
    } catch (err) {
        console.error('❌ Complete rental error:', err);
        alert('Gagal selesaikan penyewaan!');
    }
}
