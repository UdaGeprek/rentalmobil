// ============================================
// SUPABASE CAR RENTAL MANAGEMENT SYSTEM
// ============================================

// Global Variables
let supabaseClient;

// ============================================
// WAIT FOR DOM & LIBRARIES
// ============================================
console.log('🔄 Script loaded, waiting for DOM...');

window.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM loaded');
    
    let retryCount = 0;
    const maxRetries = 20;
    
    const checkLibraries = setInterval(function() {
        retryCount++;
        console.log(`🔍 Checking libraries... (${retryCount}/${maxRetries})`);
        
        if (typeof window.supabase === 'undefined') {
            console.warn('⚠️ Supabase not loaded yet');
            if (retryCount >= maxRetries) {
                clearInterval(checkLibraries);
                alert('ERROR: Supabase library gagal load! Cek koneksi internet.');
                return;
            }
            return;
        }
        
        if (typeof CryptoJS === 'undefined') {
            console.warn('⚠️ CryptoJS not loaded yet');
            if (retryCount >= maxRetries) {
                clearInterval(checkLibraries);
                alert('ERROR: CryptoJS library gagal load!');
                return;
            }
            return;
        }
        
        clearInterval(checkLibraries);
        console.log('✅ All libraries loaded!');
        initializeApp();
    }, 300);
});

// ============================================
// INITIALIZE APP
// ============================================
function initializeApp() {
    console.log('🚀 Initializing app...');
    
    const SUPABASE_URL = 'https://shnzpvacqcmkycdmdlaw.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNobnpwdmFjcWNta3ljZG1kbGF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1NDE2MjYsImV4cCI6MjA4NDExNzYyNn0.bUn14JOIO6uSkrwHkjRh4arjfZrDlSSLbf1l_c3HVZI';
    
    try {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log('✅ Supabase initialized');
        
        setupEventListeners();
        checkSession();
        
    } catch (err) {
        console.error('❌ Initialize failed:', err);
        alert('Error: ' + err.message);
    }
}

// ============================================
// EVENT LISTENERS
// ============================================
function setupEventListeners() {
    console.log('📝 Setting up event listeners...');
    
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
        console.log('✅ Login form listener attached');
    }
    
    // Image preview
    const imageInput = document.getElementById('carImageInput');
    if (imageInput) {
        imageInput.addEventListener('change', handleImagePreview);
    }
    
    // Global functions
    window.showPage = showPage;
    window.logout = logout;
    window.startEditCustomer = startEditCustomer;
    window.startEditCar = startEditCar;
    window.saveCustomer = saveCustomer;
    window.saveCar = saveCar;
    window.saveRental = saveRental;
    window.completeRental = completeRental;
    window.startCreateRental = startCreateRental;
}

// ============================================
// AUTH: LOGIN
// ============================================
async function handleLogin(e) {
    e.preventDefault();
    console.log('🔐 Login attempt...');
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const errorMsg = document.getElementById('loginError');
    const btn = e.target.querySelector('button[type="submit"]');
    
    console.log('📧 Email:', email);
    
    try {
        btn.disabled = true;
        btn.textContent = 'MEMPROSES...';
        errorMsg.style.display = 'none';
        
        const hashedPassword = CryptoJS.SHA256(password).toString();
        console.log('🔒 Password hashed');
        
        const { data, error } = await supabaseClient
            .from('admin')
            .select('*')
            .eq('email', email)
            .eq('password', hashedPassword)
            .single();
        
        console.log('📊 Query result:', { data, error });
        
        if (error || !data) {
            throw new Error('Email atau kata sandi salah!');
        }
        
        console.log('✅ Login successful');
        
        // Save session
        localStorage.setItem('admin_session', JSON.stringify({
            id: data.id,
            email: data.email,
            nama: data.nama || 'Admin',
            loginTime: new Date().toISOString()
        }));
        
        // Switch to main app
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
        
        updateUserInfo(data);
        await loadAllData();
        showPage('dashboard');
        
    } catch (err) {
        console.error('❌ Login error:', err);
        errorMsg.textContent = err.message;
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
    console.log('🔍 Checking session...');
    
    const raw = localStorage.getItem('admin_session');
    if (!raw) {
        console.log('ℹ️ No session found');
        return;
    }
    
    try {
        const admin = JSON.parse(raw);
        console.log('✅ Session found:', admin.email);
        
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
        
        updateUserInfo(admin);
        await loadAllData();
        showPage('dashboard');
        
    } catch (e) {
        console.error('❌ Invalid session');
        localStorage.removeItem('admin_session');
    }
}

// ============================================
// AUTH: LOGOUT
// ============================================
function logout() {
    console.log('👋 Logout');
    localStorage.removeItem('admin_session');
    document.getElementById('mainApp').style.display = 'none';
    document.getElementById('loginPage').style.display = 'flex';
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
}

// ============================================
// UI: UPDATE USER INFO
// ============================================
function updateUserInfo(admin) {
    const avatar = document.querySelector('.user-avatar');
    const nameEl = document.querySelector('.user-details h6');
    
    if (avatar && admin.nama) {
        avatar.textContent = admin.nama.charAt(0).toUpperCase();
    }
    
    if (nameEl && admin.nama) {
        nameEl.textContent = admin.nama;
    }
}

// ============================================
// UI: SHOW PAGE
// ============================================
function showPage(pageName, element) {
    console.log('📄 Show page:', pageName);
    
    document.querySelectorAll('[id^="page-"]').forEach(p => p.style.display = 'none');
    
    const page = document.getElementById(`page-${pageName}`);
    if (page) page.style.display = 'block';
    
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    if (element) element.classList.add('active');
    
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
// HELPERS
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
// IMAGE UPLOAD
// ============================================
function handleImagePreview(event) {
    const file = event.target.files[0];
    const preview = document.getElementById('imagePreview');
    const container = document.getElementById('imagePreviewContainer');
    
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            container.style.display = 'block';
        };
        reader.readAsDataURL(file);
    } else {
        container.style.display = 'none';
    }
}

async function uploadCarImage(file, carId) {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${carId}_${Date.now()}.${fileExt}`;
        const filePath = `car-images/${fileName}`;
        
        const { error: uploadError } = await supabaseClient.storage
            .from('mobil-images')
            .upload(filePath, file);
        
        if (uploadError) throw uploadError;
        
        const { data: publicData } = supabaseClient.storage
            .from('mobil-images')
            .getPublicUrl(filePath);
        
        return publicData.publicUrl;
        
    } catch (err) {
        console.error('❌ Upload failed:', err);
        throw new Error('Gagal upload gambar');
    }
}

// ============================================
// LOAD DATA
// ============================================
async function loadAllData() {
    console.log('📊 Loading all data...');
    
    try {
        await Promise.all([
            loadDashboard(),
            loadCustomers(),
            loadCars(),
            loadRentals()
        ]);
        console.log('✅ All data loaded');
    } catch (err) {
        console.error('❌ Load error:', err);
    }
}

// ============================================
// DASHBOARD
// ============================================
async function loadDashboard() {
    try {
        const [carsRes, rentalsRes] = await Promise.all([
            supabaseClient.from('mobil').select('id, status'),
            supabaseClient.from('penyewaan').select('id, totalharga, status')
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

        console.log('✅ Dashboard:', { totalMobil, tersedia, disewa, pendapatan });
    } catch (err) {
        console.error('❌ Dashboard error:', err);
    }
}

// ============================================
// CUSTOMERS
// ============================================
async function loadCustomers() {
    try {
        const { data, error } = await supabaseClient
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
                <td><span class="badge-status badge-active">${p.status}</span></td>
                <td>
                    <button class="btn btn-outline btn-sm" onclick="startEditCustomer('${p.id}')">Edit</button>
                </td>
            </tr>
        `).join('');
        
        console.log('✅ Customers:', data.length);
    } catch (err) {
        console.error('❌ Customers error:', err);
    }
}

async function startEditCustomer(id) {
    try {
        const { data } = await supabaseClient
            .from('pelanggan')
            .select('*')
            .eq('id', id)
            .single();
        
        if (!data) {
            alert('Data tidak ditemukan!');
            return;
        }
        
        const modal = document.getElementById('customerModal');
        const inputs = modal.querySelectorAll('input');
        
        modal.dataset.editId = data.id;
        modal.querySelector('.modal-title').textContent = 'Edit Pelanggan';
        
        if (inputs[0]) inputs[0].value = data.nik;
        if (inputs[1]) inputs[1].value = data.nama;
        if (inputs[2]) inputs[2].value = data.telepon;
        
        new bootstrap.Modal(modal).show();
    } catch (err) {
        console.error('❌ Edit error:', err);
    }
}

async function saveCustomer() {
    try {
        const modal = document.getElementById('customerModal');
        const inputs = modal.querySelectorAll('input');
        
        const nik = inputs[0]?.value.trim();
        const nama = inputs[1]?.value.trim();
        const telepon = inputs[2]?.value.trim();
        const editId = modal.dataset.editId;
        
        if (!nik || !nama || !telepon) {
            alert('Lengkapi semua data!');
            return;
        }
        
        if (editId) {
            await supabaseClient
                .from('pelanggan')
                .update({ nik, nama, telepon })
                .eq('id', editId);
        } else {
            const { data: lastCust } = await supabaseClient
                .from('pelanggan')
                .select('kode_pelanggan')
                .order('kode_pelanggan', { ascending: false })
                .limit(1)
                .single();
            
            const lastNum = lastCust ? parseInt(lastCust.kode_pelanggan.slice(3)) : 0;
            const kode = 'CST' + String(lastNum + 1).padStart(3, '0');
            
            await supabaseClient
                .from('pelanggan')
                .insert({ kode_pelanggan: kode, nik, nama, telepon, status: 'aktif' });
        }
        
        bootstrap.Modal.getInstance(modal).hide();
        delete modal.dataset.editId;
        await loadCustomers();
        
        console.log('✅ Customer saved');
    } catch (err) {
        console.error('❌ Save error:', err);
        alert('Gagal simpan: ' + err.message);
    }
}

// ============================================
// CARS
// ============================================
async function loadCars() {
    try {
        const { data, error } = await supabaseClient
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
                            ? `<img src="${m.image_url}" alt="${m.nama}" style="width: 90%; height: auto; object-fit: contain;">`
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
                    <div class="car-price">${formatCurrency(m.hargaperhari)} <span>/hari</span></div>
                    <div class="car-actions">
                        <button class="btn btn-outline btn-sm" onclick="startEditCar('${m.id}')">Edit</button>
                        <button class="btn btn-primary btn-sm">Sewa</button>
                    </div>
                </div>
            </div>
        `).join('');
        
        console.log('✅ Cars:', data.length);
    } catch (err) {
        console.error('❌ Cars error:', err);
    }
}

async function startEditCar(id) {
    try {
        const { data } = await supabaseClient.from('mobil').select('*').eq('id', id).single();
        
        if (!data) return;
        
        const modal = document.getElementById('carModal');
        modal.dataset.editId = data.id;
        modal.querySelector('.modal-title').textContent = 'Edit Mobil';
        
        const inputs = modal.querySelectorAll('input');
        if (inputs[0]) inputs[0].value = data.nama;
        if (inputs[1]) inputs[1].value = data.plat_nomor;
        if (inputs[2]) inputs[2].value = data.hargaperhari;
        
        new bootstrap.Modal(modal).show();
    } catch (err) {
        console.error('❌ Edit error:', err);
    }
}

async function saveCar() {
    try {
        const modal = document.getElementById('carModal');
        const selects = modal.querySelectorAll('select');
        const inputs = modal.querySelectorAll('input');
        const editId = modal.dataset.editId;
        
        const merek = selects[0]?.value;
        const model = inputs[0]?.value.trim();
        const plat = inputs[1]?.value.trim();
        const harga = parseInt(inputs[2]?.value);
        const imageFile = document.getElementById('carImageInput')?.files[0];
        
        if (!model || !plat || !harga) {
            alert('Lengkapi semua data!');
            return;
        }
        
        const payload = {
            nama: merek && merek !== 'Pilih Merek' ? `${merek} ${model}` : model,
            plat_nomor: plat,
            kursi: 5,
            transmisi: 'Automatic',
            bahanbakar: 'Bensin',
            hargaperhari: harga
        };
        
        let carId = editId;
        
        if (editId) {
            await supabaseClient.from('mobil').update(payload).eq('id', editId);
        } else {
            const { data: newCar } = await supabaseClient
                .from('mobil')
                .insert({...payload, status: 'tersedia'})
                .select()
                .single();
            carId = newCar?.id;
        }
        
        // Upload image if provided
        if (imageFile && carId) {
            const imageUrl = await uploadCarImage(imageFile, carId);
            await supabaseClient.from('mobil').update({ image_url: imageUrl }).eq('id', carId);
        }
        
        bootstrap.Modal.getInstance(modal).hide();
        delete modal.dataset.editId;
        modal.querySelectorAll('input').forEach(i => i.value = '');
        
        await loadCars();
        await loadDashboard();
        
        console.log('✅ Car saved');
    } catch (err) {
        console.error('❌ Save error:', err);
        alert('Gagal simpan: ' + err.message);
    }
}

// ============================================
// RENTALS
// ============================================
async function loadRentals() {
    try {
        const { data, error } = await supabaseClient
            .from('penyewaan')
            .select(`
                id, invoice, tanggalsewa, tanggalkembali, totalharga, status,
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
                <td><span class="badge-status badge-ongoing">${r.status}</span></td>
                <td>
                    ${r.status === 'Sedang Berlangsung' 
                        ? `<button class="btn btn-success btn-sm" onclick="completeRental('${r.id}')">Kembali</button>`
                        : ''
                    }
                </td>
            </tr>
        `).join('');
        
        console.log('✅ Rentals:', data.length);
    } catch (err) {
        console.error('❌ Rentals error:', err);
    }
}

async function startCreateRental() {
    console.log('🆕 Create rental');
}

async function saveRental() {
    console.log('💾 Save rental');
}

async function completeRental(id) {
    if (!confirm('Konfirmasi pengembalian?')) return;
    
    try {
        const { data: rental } = await supabaseClient
            .from('penyewaan')
            .select('mobilid')
            .eq('id', id)
            .single();
        
        await supabaseClient.from('penyewaan').update({ status: 'Selesai' }).eq('id', id);
        await supabaseClient.from('mobil').update({ status: 'tersedia' }).eq('id', rental.mobilid);
        
        await loadRentals();
        await loadCars();
        await loadDashboard();
        
        console.log('✅ Rental completed');
    } catch (err) {
        console.error('❌ Complete error:', err);
    }
}

console.log('📜 Script loaded successfully');
