# 🌳 Family Tree Builder Mobile App

A collaborative mobile application that allows users to **build, visualize, and manage family trees**, storing data locally with **SQLite** and enabling multi-device synchronization via a **Flask-based API backend**.

---

## 🧩 Project Overview

The Family Tree Builder app helps users:
- Create and edit **family trees** with detailed profiles (name, DOB, relationships, etc.).
- Visualize lineage and connections using an intuitive UI.
- **Collaborate** with other family members and sync updates across multiple devices.
- Store and retrieve data from a **local SQLite database** or a **remote Flask backend**.

This app is ideal for personal genealogy projects, family history tracking, or cultural documentation of family structures.

---

## ⚙️ Features

- 🧑‍🤝‍🧑 **Add Family Members**  
  Input personal details, relationships (parent, child, spouse), and photos.

- 🗺️ **Tree Visualization**  
  View an interactive visual layout of the family hierarchy.

- 📱 **Local Data Storage**  
  All data is stored using SQLite for fast and offline access.

- 🔁 **Multi-device Sync (via API)**  
  A Flask backend provides secure data storage and syncing across devices.

- 🛠️ **Edit & Manage Relationships**  
  Update member details, reassign parent-child links, or delete branches.

- 📸 **Attach Media** *(Optional)*  
  Add photos or notes to family member profiles.

---

## 🛠️ Tech Stack

- **Frontend:** Java + XML (Android SDK)
- **Database:** SQLite (on-device)
- **Backend (API):** Flask (Python)
- **Data Format:** JSON over HTTP (for syncing)
- **Authentication (Planned):** Token-based login system

---

## 🧠 System Architecture
Android App (Java + XML)
|
| (sync via HTTP)
↓
Flask REST API (Python)
|
↓
Remote Database (PostgreSQL or SQLite)


- Local operations use **SQLite**.
- Sync endpoint exposes API routes: `/sync`, `/fetch`, `/update`, `/login`.

---

## 👨‍👩‍👧‍👦 Use Cases

- Individuals interested in tracing their ancestry
- Families maintaining genealogy records
- Cultural or historical researchers
- Educational tools for teaching family structures

---

## 🚀 Future Improvements

- 🛡️ User authentication & profile management
- 📂 Export/import family tree (PDF, image, JSON)
- 📍 Geographical mapping of family origin
- 🗣️ Multi-language support
- ☁️ Cloud backup options (Google Drive, Dropbox, etc.)

---

## 🤝 Contributing

Interested in contributing?
- Improve the visualization UI
- Add new family member attributes (e.g., biography, birthplace)
- Enhance syncing logic and backend security

Feel free to fork the repo and open a pull request.

---


## 👨‍💻 Developer

**[Murungi Oscar]**  
Email: murungioscar@gmail.com  
GitHub: [your-username](https://github.com/o-ckaaaaaaaa)


