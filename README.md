# 📌 Blockchain-Based Document Management & Verification System

A secure document management system that uses **Blockchain** and **SHA-256 hashing** to protect documents from tampering.  
This project allows users to upload documents, stores their hash on a blockchain, and enables verifiers to check the authenticity of any uploaded file.

---

## 🚀 Features

### ✔ Secure Document Upload  
Users can upload documents (PDF, PNG, JPG, TXT, etc.).

### ✔ Hash Generation (SHA-256)  
Every uploaded document is converted into a unique digital fingerprint (hash).

### ✔ Blockchain Storage  
The generated hash is stored in a **tamper-proof blockchain ledger** (Ganache / Local Blockchain).

### ✔ Document Verification  
Verifiers can upload any document to check whether it matches the original version.

### ✔ Tamper Detection  
If the document is changed even by 1 character/pixel, the system instantly detects it.

---

## 🛠️ Tools & Technologies Used

### **Frontend**
- HTML5  
- CSS3  
- JavaScript  
- Bootstrap *(optional)*  

### **Backend**
- Node.js / Python Flask / Java Spring Boot *(choose based on implementation)*  
- SHA-256 hashing library  
- REST API  

### **Blockchain Layer**
- Ganache (Local Ethereum Blockchain)  
- Web3.js  
- Solidity (Smart Contract)  
- Remix IDE / Truffle Suite  

### **Databases**
- MySQL (Document metadata)  
- MongoDB (Optional – stores logs & JSON objects)

### **Storage**
- Local File System / Cloud Storage

### **Developer Tools**
- VS Code  
- Postman  
- GitHub  

---

## 🧠 How the System Works (Workflow)

### **1. User Uploads Document**
The user u
