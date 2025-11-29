document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const uploadTab = document.getElementById('tab-upload');
    const verifyTab = document.getElementById('tab-verify');
    const dashboardTab = document.getElementById('tab-dashboard');

    const uploadForm = document.getElementById('upload-form');
    const verifyForm = document.getElementById('verify-form');
    const dashboardView = document.getElementById('dashboard-view');

    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const fileLabel = document.getElementById('file-label');

    const verifyDropZone = document.getElementById('verify-drop-zone');
    const verifyFileInput = document.getElementById('verify-file-input');
    const verifyFileLabel = document.getElementById('verify-file-label');

    let selectedFile = null;
    let selectedVerifyFile = null;

    // Tab Switching
    function switchTab(mode) {
        [uploadTab, verifyTab, dashboardTab].forEach(t => t.classList.remove('active'));
        [uploadForm, verifyForm, dashboardView].forEach(v => v.classList.add('hidden'));

        if (mode === 'upload') {
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

    // Upload Drop Zone
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
        const files = e.target.files;
        if (files.length > 0) {
            selectedFile = files[0];
            fileLabel.innerText = `Selected: ${selectedFile.name}`;
        }
    });

    // Verify Drop Zone
    verifyDropZone.addEventListener('click', () => verifyFileInput.click());
    verifyFileInput.addEventListener('change', (e) => {
        const files = e.target.files;
        if (files.length > 0) {
            selectedVerifyFile = files[0];
            verifyFileLabel.innerText = `Selected: ${selectedVerifyFile.name}`;
        }
    });

    // Upload Button
    document.getElementById('btn-upload').addEventListener('click', async () => {
        if (!selectedFile) {
            alert("Please select a file first!");
            return;
        }

        const btn = document.getElementById('btn-upload');
        const result = document.getElementById('upload-result');

        btn.disabled = true;
        btn.innerText = 'Hashing & Uploading...';

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();

            if (data.success) {
                result.innerHTML = `
                    <h3>Success! Document Secured.</h3>
                    <p>Transaction Hash:</p>
                    <div class="hash-display">${data.hash}</div>
                    <p>Block Index: ${data.blockIndex}</p>
                `;
                result.classList.remove('hidden', 'error');
                result.classList.add('success');
            } else {
                throw new Error(data.error || 'Upload failed');
            }
        } catch (err) {
            result.innerHTML = `<h3>Error</h3><p>${err.message}</p>`;
            result.classList.remove('hidden', 'success');
            result.classList.add('error');
        } finally {
            btn.disabled = false;
            btn.innerText = 'Secure Document';
        }
    });

    // Verify Button
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
            alert("Please enter a hash or upload a file.");
            return;
        }

        btn.disabled = true;
        btn.innerText = 'Verifying on Blockchain...';

        try {
            const res = await fetch('/api/verify', options);
            const data = await res.json();

            if (data.authentic) {
                result.innerHTML = `
                    <h3>✅ Document Authentic</h3>
                    <p>Matches blockchain record.</p>
                    <div class="hash-display">Block #${data.block.index} - ${data.block.timestamp}</div>
                `;
                result.classList.remove('hidden', 'error');
                result.classList.add('success');
            } else {
                result.innerHTML = `<h3>❌ Tamper Detected</h3><p>No matching record found on blockchain.</p>`;
                result.classList.remove('hidden', 'success');
                result.classList.add('error');
            }
        } catch (err) {
            result.innerHTML = `<h3>Error</h3><p>${err.message}</p>`;
            result.classList.remove('hidden', 'success');
            result.classList.add('error');
        } finally {
            btn.disabled = false;
            btn.innerText = 'Verify Authenticity';
        }
    });

    // Dashboard Loader
    async function loadDashboard() {
        const blockchainTable = document.querySelector('#blockchain-table tbody');
        const dbTable = document.querySelector('#db-table tbody');

        blockchainTable.innerHTML = '<tr><td colspan="4">Loading...</td></tr>';
        dbTable.innerHTML = '<tr><td colspan="4">Loading...</td></tr>';

        try {
            const res = await fetch('/api/dashboard');
            const data = await res.json();

            blockchainTable.innerHTML = data.blocks.map(b => `
                <tr>
                    <td>${b.index}</td>
                    <td>${new Date(b.timestamp).toLocaleString()}</td>
                    <td class="hash-cell" title="${b.hash}">${b.hash}</td>
                    <td class="hash-cell">${JSON.stringify(b.data)}</td>
                </tr>
            `).join('');

            if (data.documents && data.documents.length > 0) {
                dbTable.innerHTML = data.documents.map(d => `
                    <tr>
                        <td>${d.document_id}</td>
                        <td>${d.title}</td>
                        <td class="hash-cell" title="${d.blockchain_hash}">${d.blockchain_hash}</td>
                        <td>${new Date(d.upload_date).toLocaleString()}</td>
                    </tr>
                `).join('');
            } else {
                dbTable.innerHTML = '<tr><td colspan="4">No records yet - upload a document to get started!</td></tr>';
            }

        } catch (err) {
            console.error(err);
            blockchainTable.innerHTML = '<tr><td colspan="4">Error loading data</td></tr>';
        }
    }
});
