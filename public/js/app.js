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

            // Enable buttons based on role
            const uploadBtn = document.getElementById('btn-upload');

            if (currentUser.role === 'admin' || currentUser.role === 'uploader') {
                uploadBtn.disabled = false;
            } else {
                uploadBtn.disabled = true;
                uploadTab.style.opacity = '0.5';
                uploadTab.style.cursor = 'not-allowed';
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
            if (currentUser.role === 'verifier') {
                alert('You do not have permission to upload documents.');
                return;
            }
            uploadTab.classList.add('active');
            uploadForm.classList.remove('hidden');
        } else if (mode === 'verify') {
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

    // Load Institutions
    async function loadInstitutions() {
        try {
            const res = await fetch('/api/institutions');
            const data = await res.json();

            data.institutions.forEach(inst => {
                const option = document.createElement('option');
                option.value = inst.institution_id;
                option.textContent = inst.name;
                institutionSelect.appendChild(option);
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
        if (!institutionSelect.value) {
            alert('Please select your institution first!');
            return;
        }

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
        formData.append('institutionId', institutionSelect.value);

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
                institutionSelect.value = '';
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
            btn.disabled = currentUser && (currentUser.role === 'admin' || currentUser.role === 'uploader') ? false : true;
            btn.textContent = 'Secure Document';
        }
    });

    // Verify Document
    document.getElementById('btn-verify').addEventListener('click', async () => {
        const btn = document.getElementById('btn-verify');
        const result = document.getElementById('verify-result');
        const hashInput = document.getElementById('verify-hash').value.trim();

        let options = {};

        if (selectedVerifyFile) {
            const formData = new FormData();
            formData.append('file', selectedVerifyFile);
            options = {
                method: 'POST',
                body: formData
            };
        } else if (hashInput) {
            options = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hash: hashInput })
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
        const documentsTable = document.getElementById('documents-table');
        const blockchainTable = document.getElementById('blockchain-table');

        documentsTable.innerHTML = '<tr><td colspan="6">Loading...</td></tr>';
        blockchainTable.innerHTML = '<tr><td colspan="4">Loading...</td></tr>';

        try {
            const res = await fetch('/api/dashboard');
            const data = await res.json();

            // Documents
            if (data.documents && data.documents.length > 0) {
                documentsTable.innerHTML = data.documents.map(d => `
                    <tr>
                        <td>${d.doc_id}</td>
                        <td>${d.title}</td>
                        <td>${d.institution_name || 'N/A'}</td>
                        <td class="hash-cell" title="${d.sha256_hash}">${d.sha256_hash || 'N/A'}</td>
                        <td class="hash-cell" title="${d.blockchain_tx}">${d.blockchain_tx || 'N/A'}</td>
                        <td>${new Date(d.created_at).toLocaleString()}</td>
                    </tr>
                `).join('');
            } else {
                documentsTable.innerHTML = '<tr><td colspan="6">No documents yet</td></tr>';
            }

            // Blockchain
            if (data.blocks && data.blocks.length > 0) {
                blockchainTable.innerHTML = data.blocks.map(b => `
                    <tr>
                        <td>${b.index}</td>
                        <td>${new Date(b.timestamp).toLocaleString()}</td>
                        <td class="hash-cell" title="${b.hash}">${b.hash}</td>
                        <td class="hash-cell">${JSON.stringify(b.data)}</td>
                    </tr>
                `).join('');
            }

        } catch (err) {
            console.error(err);
            documentsTable.innerHTML = '<tr><td colspan="6">Error loading data</td></tr>';
        }
    }
});
