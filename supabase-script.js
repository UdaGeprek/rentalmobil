console.log('🔄 Script starting...');

let db;

window.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM ready');
    
    setTimeout(function() {
        if (typeof window.supabase === 'undefined') {
            alert('❌ Supabase library tidak load!');
            return;
        }
        
        if (typeof CryptoJS === 'undefined') {
            alert('❌ CryptoJS library tidak load!');
            return;
        }
        
        console.log('✅ Libraries OK');
        
        db = window.supabase.createClient(
            'https://shnzpvacqcmkycdmdlaw.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNobnpwdmFjcWNta3ljZG1kbGF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1NDE2MjYsImV4cCI6MjA4NDExNzYyNn0.bUn14JOIO6uSkrwHkjRh4arjfZrDlSSLbf1l_c3HVZI'
        );
        
        console.log('✅ Supabase initialized');
        
        // LOGIN FORM
        const form = document.getElementById('loginForm');
        if (form) {
            form.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                const hash = CryptoJS.SHA256(password).toString();
                const errorMsg = document.getElementById('loginError');
                const btn = e.target.querySelector('button[type="submit"]');
                
                console.log('🔐 Login:', email);
                
                try {
                    btn.disabled = true;
                    btn.textContent = 'MEMPROSES...';
                    errorMsg.style.display = 'none';
                    
                    const { data, error } = await db
                        .from('admin')
                        .select('*')
                        .eq('email', email)
                        .eq('password', hash)
                        .single();
                    
                    console.log('Result:', { data, error });
                    
                    if (data) {
                        console.log('✅ Login SUCCESS');
                        
                        localStorage.setItem('admin_session', JSON.stringify({
                            id: data.id,
                            email: data.email,
                            nama: data.nama || 'Admin'
                        }));
                        
                        document.getElementById('loginPage').style.display = 'none';
                        document.getElementById('mainApp').style.display = 'block';
                        
                        loadAllData();
                        showPage('dashboard');
                    } else {
                        throw new Error('Email atau password salah!');
                    }
                } catch (err) {
                    console.error('❌ Login error:', err);
                    errorMsg.textContent = err.message || 'Email atau kata sandi salah!';
                    errorMsg.style.display = 'block';
                } finally {
                    btn.disabled = false;
                    btn.textContent = 'MASUK';
                }
            });
        }
        
        // LOGOUT
        window.logout = function() {
            localStorage.removeItem('admin_session');
            document.getElementById('mainApp').style.display = 'none';
            document.getElementById('loginPage').style.display = 'flex';
        };
        
        // SHOW PAGE
        window.showPage = function(page) {
            document.querySelectorAll('[id^="page-"]').forEach(p => p.style.display = 'none');
            const el = document.getElementById('page-' + page);
            if (el) el.style.display = 'block';
            
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            
            const titles = {
                'dashboard': 'Dashboard',
                'cars': 'Data Mobil',
                'customers': 'Data Pelanggan',
                'rentals': 'Data Penyewaan',
                'returns': 'Pengembalian',
                'transactions': 'Keuangan'
            };
            document.getElementById('pageTitle').textContent = titles[page] || page;
        };
        
        // LOAD DATA
        async function loadAllData() {
            console.log('📊 Loading data...');
            
            // Dashboard stats
            const { data: cars } = await db.from('mobil').select('status');
            const { data: rentals } = await db.from('penyewaan').select('totalharga, status');
            
            const stats = document.querySelectorAll('.stat-card .stat-info h3');
            stats[0].textContent = cars?.length || 0;
            stats[1].textContent = cars?.filter(c => c.status === 'tersedia').length || 0;
            stats[2].textContent = cars?.filter(c => c.status === 'disewa').length || 0;
            
            const pendapatan = (rentals || [])
                .filter(r => r.status === 'Selesai' || r.status === 'Sedang Berlangsung')
                .reduce((sum, r) => sum + Number(r.totalharga || 0), 0);
            stats[3].textContent = 'Rp ' + pendapatan.toLocaleString('id-ID');
            
            // Load cars
            const { data: mobilData } = await db.from('mobil').select('*').order('nama');
            const carsContainer = document.querySelector('#page-cars .row');
            
            if (carsContainer && mobilData) {
                carsContainer.innerHTML = mobilData.map(m => `
                    <div class="col-md-4">
                        <div class="car-card">
                            <div class="car-image" style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)">
                                ${m.image_url 
                                    ? `<img src="${m.image_url}" alt="${m.nama}" style="width: 90%; height: auto;">`
                                    : `<div style="padding: 60px; text-align: center; color: #fff;">📷</div>`
                                }
                                <span class="car-status ${m.status === 'tersedia' ? 'badge-available' : 'badge-rented'}">
                                    ${m.status === 'tersedia' ? 'Tersedia' : 'Disewa'}
                                </span>
                            </div>
                            <div class="car-info">
                                <div class="car-title">${m.nama}</div>
                                <div class="car-plate">${m.plat_nomor}</div>
                            </div>
                            <div class="car-price">Rp ${Number(m.hargaperhari).toLocaleString('id-ID')} <span>/hari</span></div>
                        </div>
                    </div>
                `).join('');
            }
            
            // Load customers
            const { data: custData } = await db.from('pelanggan').select('*').order('kode_pelanggan');
            const custTbody = document.querySelector('#page-customers tbody');
            
            if (custTbody && custData) {
                custTbody.innerHTML = custData.map(c => `
                    <tr>
                        <td><strong>${c.kode_pelanggan}</strong></td>
                        <td>${c.nama}</td>
                        <td>${c.nik}</td>
                        <td>${c.telepon}</td>
                        <td><span class="badge-status badge-active">${c.status}</span></td>
                        <td><button class="btn btn-outline btn-sm">Edit</button></td>
                    </tr>
                `).join('');
            }
            
            // Load rentals
            const { data: rentalData } = await db
                .from('penyewaan')
                .select('*, pelanggan:pelangganid(nama), mobil:mobilid(nama)')
                .order('created_at', { ascending: false });
            
            const rentalTbody = document.querySelector('#page-rentals tbody');
            
            if (rentalTbody && rentalData) {
                rentalTbody.innerHTML = rentalData.map(r => `
                    <tr>
                        <td><strong>${r.invoice}</strong></td>
                        <td>${r.pelanggan?.nama || '-'}</td>
                        <td>${r.mobil?.nama || '-'}</td>
                        <td>${r.tanggalsewa} - ${r.tanggalkembali}</td>
                        <td><strong>Rp ${Number(r.totalharga).toLocaleString('id-ID')}</strong></td>
                        <td><span class="badge-status badge-ongoing">${r.status}</span></td>
                        <td><button class="btn btn-outline btn-sm">Detail</button></td>
                    </tr>
                `).join('');
            }
            
            console.log('✅ Data loaded');
        }
        
        window.loadAllData = loadAllData;
        
    }, 1000);
});

console.log('📜 Script loaded');
