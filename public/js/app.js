document.addEventListener('DOMContentLoaded', () => {
    // Check authentication immediately
    checkAuthAndRedirect();

    // Elements
    const uploadTab = document.getElementById('tab-upload');
    const verifyTab = document.getElementById('tab-verify');
    const dashboardTab = document.getElementById('tab-dashboard');

    const uploadForm = document.getElementById('upload-form');
    const verifyForm = document.getElementById('verify-form');
    const dashboardView = document.getElementById('dashboard-view');

    const logoutBtn = document.getElementById('btn-logout');
    const userName = document.getElementById('user-name');
    const userRole = document.getElementById('user-role');

    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const fileLabel = document.getElementById('file-label');
    const institutionSelect = document.getElementById('institution-select');

    const verifyDropZone = document.getElementById('verify-drop-zone');
    const verifyFileInput = document.getElementById('verify-file-input');
    const verifyFileLabel = document.getElementById('verify-file-label');

    let selectedFile = null;
    let selectedVerifyFile = null;
    let currentUser = null;

    // Check authentication
    async function checkAuthAndRedirect() {
        try {
            const res = await fetch('/api/me');
            if (res.ok) {
                const data = await res.json();
                currentUser = data.user;
                updateUI();
                loadInstitutions();
            } else {
                // Not logged in, redirect to login page
                window.location.href = '/login.html';
            }
        } catch (err) {
            console.error('Auth check failed:', err);
            window.location.href = '/login.html';
        }
    }

    function updateUI() {
        if (currentUser) {
            userName.textContent = currentUser.name;
            userRole.textContent = currentUser.role;

            // Strict Role-Based UI
            if (currentUser.role === 'uploader') {
                // Uploader: Show Upload & Dashboard, Hide Verify
                uploadTab.style.display = 'inline-block';
                verifyTab.style.display = 'none';
                dashboardTab.style.display = 'inline-block';

                // Auto-select institution for uploader
                loadUploaderInstitution();
                switchTab('upload');
            } else if (currentUser.role === 'verifier') {
                // Verifier: Show Verify ONLY, Hide Upload & Dashboard
                uploadTab.style.display = 'none';
                verifyTab.style.display = 'inline-block';
                dashboardTab.style.display = 'none';

                switchTab('verify');
            } else if (currentUser.role === 'admin') {
                // Admin: Show Dashboard ONLY
                uploadTab.style.display = 'none';
                verifyTab.style.display = 'none';
                dashboardTab.style.display = 'inline-block';
                switchTab('dashboard');
            }
        }
    }

    async function loadUploaderInstitution() {
        // The /api/me endpoint now returns institutionId.
        if (currentUser.institutionId) {
            // Fetch institution name
            try {
                const res = await fetch('/api/institutions');
                const data = await res.json();
                const inst = data.institutions.find(i => i.institution_id === currentUser.institutionId);
                if (inst) {
                    document.getElementById('uploader-institution').textContent = inst.name;
                    document.getElementById('btn-upload').disabled = false;
                }
            } catch (err) {
                console.error('Error fetching institution:', err);
            }
        }
    }

    logoutBtn.addEventListener('click', async () => {
        try {
            await fetch('/api/logout', { method: 'POST' });
            window.location.href = '/login.html';
        } catch (err) {
            console.error('Logout failed:', err);
        }
    });

    // Tab Switching
    function switchTab(mode) {
        [uploadTab, verifyTab, dashboardTab].forEach(t => t.classList.remove('active'));
        [uploadForm, verifyForm, dashboardView].forEach(v => v.classList.add('hidden'));

        if (mode === 'upload') {
            if (currentUser.role === 'verifier' || currentUser.role === 'admin') {
                alert('You do not have permission to upload documents.');
                return;
            }
            uploadTab.classList.add('active');
            uploadForm.classList.remove('hidden');
        } else if (mode === 'verify') {
            if (currentUser.role === 'admin') {
                alert('Admins view analytics only.');
                return;
            }
            verifyTab.classList.add('active');
            verifyForm.classList.remove('hidden');
        } else if (mode === 'dashboard') {
            dashboardTab.classList.add('active');
            dashboardView.classList.remove('hidden');
            loadDashboard();
        }
    }

    uploadTab.addEventListener('click', () => switchTab('upload'));
    verifyTab.addEventListener('click', () => switchTab('verify'));
    dashboardTab.addEventListener('click', () => switchTab('dashboard'));

    // Load Institutions for Verifier
    async function loadInstitutions() {
        try {
            const res = await fetch('/api/institutions');
            const data = await res.json();

            const verifySelect = document.getElementById('verify-institution-select');
            // Clear existing except first
            verifySelect.innerHTML = '<option value="">-- All Institutions --</option>';

            data.institutions.forEach(inst => {
                const option = document.createElement('option');
                option.value = inst.institution_id;
                option.textContent = inst.name;
                verifySelect.appendChild(option);
            });
        } catch (err) {
            console.error('Failed to load institutions:', err);
        }
    }

    // Upload handlers
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            selectedFile = e.target.files[0];
            fileLabel.textContent = `Selected: ${selectedFile.name}`;
            // Enable the upload button when file is selected
            document.getElementById('btn-upload').disabled = false;
        }
    });

    verifyDropZone.addEventListener('click', () => verifyFileInput.click());
    verifyFileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            selectedVerifyFile = e.target.files[0];
            verifyFileLabel.textContent = `Selected: ${selectedVerifyFile.name}`;
        }
    });

    // Upload Document
    document.getElementById('btn-upload').addEventListener('click', async () => {
        if (!selectedFile) {
            alert('Please select a file!');
            return;
        }

        const btn = document.getElementById('btn-upload');
        const result = document.getElementById('upload-result');

        btn.disabled = true;
        btn.textContent = 'Uploading & Hashing...';

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            const data = await res.json();

            if (res.ok) {
                result.innerHTML = `
                    <h3>✅ Document Secured Successfully</h3>
                    <p><strong>Document ID:</strong> ${data.document.docId}</p>
                    <p><strong>SHA-256 Hash:</strong></p>
                    <div class="hash-display">${data.document.hash}</div>
                    <p><strong>Blockchain TX:</strong></p>
                    <div class="hash-display">${data.document.tx}</div>
                    <p><strong>Block Number:</strong> ${data.document.blockIndex}</p>
                `;
                result.classList.remove('hidden', 'error');
                result.classList.add('success');

                // Reset
                selectedFile = null;
                fileLabel.textContent = 'Click to select a document';
                fileInput.value = '';
            } else {
                result.innerHTML = `<h3>❌ Upload Failed</h3><p>${data.error}</p>`;
                result.classList.remove('hidden', 'success');
                result.classList.add('error');
            }
        } catch (err) {
            result.innerHTML = `<h3>Error</h3><p>${err.message}</p>`;
            result.classList.remove('hidden', 'success');
            result.classList.add('error');
        } finally {
            btn.disabled = currentUser && (currentUser.role === 'uploader') ? false : true;
            btn.textContent = 'Secure Document';
        }
    });

    // Verify Document
    document.getElementById('btn-verify').addEventListener('click', async () => {
        const btn = document.getElementById('btn-verify');
        const result = document.getElementById('verify-result');
        const hashInput = document.getElementById('verify-hash').value.trim();
        const institutionId = document.getElementById('verify-institution-select').value;

        let options = {};

        if (selectedVerifyFile) {
            const formData = new FormData();
            formData.append('file', selectedVerifyFile);
            if (institutionId) formData.append('institutionId', institutionId);
            options = {
                method: 'POST',
                body: formData
            };
        } else if (hashInput) {
            const body = { hash: hashInput };
            if (institutionId) body.institutionId = institutionId;

            options = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            };
        } else {
            alert('Please enter a hash or upload a file');
            return;
        }

        btn.disabled = true;
        btn.textContent = 'Verifying...';

        try {
            const res = await fetch('/api/verify', options);
            const data = await res.json();

            if (data.revoked) {
                result.innerHTML = `
                    <h3>🚫 Document Revoked</h3>
                    <p>This document has been revoked and is no longer valid.</p>
                    <p><strong>Reason:</strong> ${data.reason || 'No reason provided'}</p>
                `;
                result.classList.remove('hidden', 'success');
                result.classList.add('error');
            } else if (data.authentic) {
                result.innerHTML = `
                    <h3>✅ Document Authentic</h3>
                    <p>This document is valid and matches blockchain records.</p>
                `;
                result.classList.remove('hidden', 'error');
                result.classList.add('success');
            } else {
                result.innerHTML = `
                    <h3>❌ Document Tampered or Not Found</h3>
                    <p>This document does not match any blockchain records or has been modified.</p>
                `;
                result.classList.remove('hidden', 'success');
                result.classList.add('error');
            }

            // Reset
            selectedVerifyFile = null;
            verifyFileLabel.textContent = 'Or click to upload document for verification';
            verifyFileInput.value = '';
            document.getElementById('verify-hash').value = '';

        } catch (err) {
            result.innerHTML = `<h3>Error</h3><p>${err.message}</p>`;
            result.classList.remove('hidden', 'success');
            result.classList.add('error');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Verify Document';
        }
    });

    // Load Dashboard
    async function loadDashboard() {
        const uploaderDash = document.getElementById('uploader-dashboard');
        const adminDash = document.getElementById('admin-dashboard');
        const documentsTable = document.getElementById('documents-table');
        const blockchainTable = document.getElementById('blockchain-table');

        // Reset views
        uploaderDash.classList.add('hidden');
        adminDash.classList.add('hidden');
        if (document.getElementById('verifier-dashboard')) {
            document.getElementById('verifier-dashboard').classList.add('hidden');
        }

        uploadTab.addEventListener('click', () => switchTab('upload'));
        verifyTab.addEventListener('click', () => switchTab('verify'));
        dashboardTab.addEventListener('click', () => switchTab('dashboard'));

        // Load Institutions for Verifier
        async function loadInstitutions() {
            try {
                const res = await fetch('/api/institutions');
                const data = await res.json();

                const verifySelect = document.getElementById('verify-institution-select');
                // Clear existing except first
                verifySelect.innerHTML = '<option value="">-- All Institutions --</option>';

                data.institutions.forEach(inst => {
                    const option = document.createElement('option');
                    option.value = inst.institution_id;
                    option.textContent = inst.name;
                    verifySelect.appendChild(option);
                });
            } catch (err) {
                console.error('Failed to load institutions:', err);
            }
        }

        // Upload handlers
        dropZone.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                selectedFile = e.target.files[0];
                fileLabel.textContent = `Selected: ${selectedFile.name}`;
                // Enable the upload button when file is selected
                document.getElementById('btn-upload').disabled = false;
            }
        });

        verifyDropZone.addEventListener('click', () => verifyFileInput.click());
        verifyFileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                selectedVerifyFile = e.target.files[0];
                verifyFileLabel.textContent = `Selected: ${selectedVerifyFile.name}`;
            }
        });

        // Upload Document
        document.getElementById('btn-upload').addEventListener('click', async () => {
            if (!selectedFile) {
                alert('Please select a file!');
                return;
            }

            const btn = document.getElementById('btn-upload');
            const result = document.getElementById('upload-result');

            btn.disabled = true;
            btn.textContent = 'Uploading & Hashing...';

            const formData = new FormData();
            formData.append('file', selectedFile);

            try {
                const res = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData
                });

                const data = await res.json();

                if (res.ok) {
                    result.innerHTML = `
                    <h3>✅ Document Secured Successfully</h3>
                    <p><strong>Document ID:</strong> ${data.document.docId}</p>
                    <p><strong>SHA-256 Hash:</strong></p>
                    <div class="hash-display">${data.document.hash}</div>
                    <p><strong>Blockchain TX:</strong></p>
                    <div class="hash-display">${data.document.tx}</div>
                    <p><strong>Block Number:</strong> ${data.document.blockIndex}</p>
                `;
                    result.classList.remove('hidden', 'error');
                    result.classList.add('success');

                    // Reset
                    selectedFile = null;
                    fileLabel.textContent = 'Click to select a document';
                    fileInput.value = '';
                } else {
                    result.innerHTML = `<h3>❌ Upload Failed</h3><p>${data.error}</p>`;
                    result.classList.remove('hidden', 'success');
                    result.classList.add('error');
                }
            } catch (err) {
                result.innerHTML = `<h3>Error</h3><p>${err.message}</p>`;
                result.classList.remove('hidden', 'success');
                result.classList.add('error');
            } finally {
                btn.disabled = currentUser && (currentUser.role === 'uploader') ? false : true;
                btn.textContent = 'Secure Document';
            }
        });

        // Verify Document
        document.getElementById('btn-verify').addEventListener('click', async () => {
            const btn = document.getElementById('btn-verify');
            const result = document.getElementById('verify-result');
            const hashInput = document.getElementById('verify-hash').value.trim();
            const institutionId = document.getElementById('verify-institution-select').value;

            let options = {};

            if (selectedVerifyFile) {
                const formData = new FormData();
                formData.append('file', selectedVerifyFile);
                if (institutionId) formData.append('institutionId', institutionId);
                options = {
                    method: 'POST',
                    body: formData
                };
            } else if (hashInput) {
                const body = { hash: hashInput };
                if (institutionId) body.institutionId = institutionId;

                options = {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                };
            } else {
                alert('Please enter a hash or upload a file');
                return;
            }

            btn.disabled = true;
            btn.textContent = 'Verifying...';

            try {
                const res = await fetch('/api/verify', options);
                const data = await res.json();

                if (data.revoked) {
                    result.innerHTML = `
                    <h3>🚫 Document Revoked</h3>
                    <p>This document has been revoked and is no longer valid.</p>
                    <p><strong>Reason:</strong> ${data.reason || 'No reason provided'}</p>
                `;
                    result.classList.remove('hidden', 'success');
                    result.classList.add('error');
                } else if (data.authentic) {
                    result.innerHTML = `
                    <h3>✅ Document Authentic</h3>
                    <p>This document is valid and matches blockchain records.</p>
                `;
                    result.classList.remove('hidden', 'error');
                    result.classList.add('success');
                } else {
                    result.innerHTML = `
                    <h3>❌ Document Tampered or Not Found</h3>
                    <p>This document does not match any blockchain records or has been modified.</p>
                `;
                    result.classList.remove('hidden', 'success');
                    result.classList.add('error');
                }

                // Reset
                selectedVerifyFile = null;
                verifyFileLabel.textContent = 'Or click to upload document for verification';
                verifyFileInput.value = '';
                document.getElementById('verify-hash').value = '';

            } catch (err) {
                result.innerHTML = `<h3>Error</h3><p>${err.message}</p>`;
                result.classList.remove('hidden', 'success');
                result.classList.add('error');
            } finally {
                btn.disabled = false;
                btn.textContent = 'Verify Document';
            }
        });

        // --- Dashboard & Analytics ---
        async function loadDashboard() {
            const uploaderDash = document.getElementById('uploader-dashboard');
            const verifierDash = document.getElementById('verifier-dashboard');
            const adminDash = document.getElementById('admin-dashboard');
            const documentsTable = document.getElementById('documents-table');
            const blockchainTable = document.getElementById('blockchain-table');

            try {
                const res = await fetch('/api/dashboard');
                const data = await res.json();

                if (data.error) throw new Error(data.error);

                // Hide all dashboards first
                uploaderDash.classList.add('hidden');
                verifierDash.classList.add('hidden');
                adminDash.classList.add('hidden');

                // Uploader View
                if (data.role === 'uploader') {
                    uploaderDash.classList.remove('hidden');

                    // Stats
                    document.getElementById('stat-total-docs').textContent = data.stats.total_docs;
                    document.getElementById('stat-verifications').textContent = data.stats.total_verifications;

                    // Charts
                    renderPieChart('uploaderChart',
                        ['Authentic', 'Tampered/Revoked'],
                        [data.stats.authentic_verifications, data.stats.tampered_verifications],
                        ['#10b981', '#ef4444']
                    );

                    renderLineChart('uploadTrendChart',
                        data.charts.uploadTrend.map(d => d.d),
                        data.charts.uploadTrend.map(d => d.c),
                        'Uploads Over Time'
                    );

                    // Recent Docs
                    if (documentsTable) {
                        documentsTable.innerHTML = data.documents.map(doc => `
                    <tr>
                        <td>${doc.title}</td>
                        <td>${new Date(doc.created_at).toLocaleDateString()}</td>
                        <td class="hash-cell" title="${doc.sha256_hash || 'Pending'}">${doc.sha256_hash || 'Pending'}</td>
                        <td><span class="status-badge status-success">Active</span></td>
                        <td>
                            <button onclick="viewDoc('${doc.doc_id}')" class="btn-sm">View</button>
                        </td>
                    </tr>
                `).join('');
                    }

                }
                // Admin View
                else if (data.role === 'admin') {
                    adminDash.classList.remove('hidden');

                    // Global Stats
                    document.getElementById('admin-total-docs').textContent = data.stats.totalDocs;
                    document.getElementById('admin-total-verify').textContent = data.stats.totalVerifications;
                    document.getElementById('admin-revoked').textContent = data.stats.revokedCount;

                    // Charts
                    renderBarChart('adminChart',
                        data.charts.topInstitutions.map(i => i.institution_name),
                        data.charts.topInstitutions.map(i => i.doc_count),
                        'Top Uploading Institutions'
                    );

                    renderPieChart('authVsTamperedChart',
                        data.charts.authVsTampered.map(r => r.result),
                        data.charts.authVsTampered.map(r => r.c),
                        ['#10b981', '#ef4444', '#f59e0b']
                    );

                    renderLineChart('dailyVerifyChart',
                        data.charts.dailyVerifications.map(d => d.d),
                        data.charts.dailyVerifications.map(d => d.c),
                        'Daily Verifications'
                    );

                    renderDoughnutChart('fileTypeChart',
                        data.charts.fileTypes.map(f => f.file_type),
                        data.charts.fileTypes.map(f => f.c)
                    );

                    // Activity Feed
                    const activityList = document.getElementById('activity-feed');
                    if (activityList) {
                        activityList.innerHTML = data.activity.map(log => `
                    <li class="activity-item">
                        <span class="time">${new Date(log.timestamp).toLocaleTimeString()}</span>
                        <span class="action">${log.action}</span>
                        <span class="desc">${log.description}</span>
                    </li>
                `).join('');
                    }
                }
                // Verifier View
                else if (data.role === 'verifier') {
                    verifierDash.classList.remove('hidden');

                    // Stats
                    document.getElementById('verifier-total').textContent = data.stats.totalVerifications;

                    // Charts
                    renderPieChart('verifierResultsChart',
                        data.charts.results.map(r => r.result),
                        data.charts.results.map(r => r.c),
                        ['#10b981', '#ef4444', '#f59e0b']
                    );

                    // History
                    const historyTable = document.getElementById('verifier-history');
                    if (historyTable) {
                        historyTable.innerHTML = data.history.map(h => `
                    <tr>
                        <td>${new Date(h.verified_at).toLocaleString()}</td>
                        <td>${h.title || 'Unknown Document'}</td>
                        <td><span class="status-badge status-${h.result === 'AUTHENTIC' ? 'success' : 'error'}">${h.result}</span></td>
                    </tr>
                `).join('');
                    }
                }

                // Blockchain Ledger (Shared)
                if (data.blocks && blockchainTable) {
                    blockchainTable.innerHTML = data.blocks.map(b => `
                <tr>
                    <td>${b.index}</td>
                    <td>${new Date(b.timestamp).toLocaleString()}</td>
                    <td class="hash-cell" title="${b.hash}">${b.hash}</td>
                    <td class="hash-cell">${JSON.stringify(b.data).substring(0, 50)}...</td>
                </tr>
            `).join('');
                }

            } catch (err) {
                console.error('Dashboard load error:', err);
            }
        }

        // --- Chart Helpers ---
        function renderPieChart(id, labels, data, colors) {
            const ctx = document.getElementById(id);
            if (!ctx) return;
            new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: labels,
                    datasets: [{ data: data, backgroundColor: colors }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }

        function renderDoughnutChart(id, labels, data) {
            const ctx = document.getElementById(id);
            if (!ctx) return;
            new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{ data: data, backgroundColor: ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981'] }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }

        function renderBarChart(id, labels, data, label) {
            const ctx = document.getElementById(id);
            if (!ctx) return;
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{ label: label, data: data, backgroundColor: '#3b82f6' }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }

        function renderLineChart(id, labels, data, label) {
            const ctx = document.getElementById(id);
            if (!ctx) return;
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{ label: label, data: data, borderColor: '#8b5cf6', tension: 0.1 }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }
    });

