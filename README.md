# 🚀 MMT-BUSINESS-HUB WhatsApp Automation Bot

[![Made With Node.js](https://img.shields.io/badge/Made%20With-Node.js-339933?logo=node.js)](https://nodejs.org/)
[![License](https://img.shields.io/github/license/mmtbusinesshub/MMT)](LICENSE)
[![Repo Size](https://img.shields.io/github/repo-size/mmtbusinesshub/MMT)](https://github.com/mmtbusinesshub/MMT)

---

## 💡 Overview

**MMT-BUSINESS-HUB** is a powerful WhatsApp automation bot built with Node.js and Baileys.
It offers advanced automation, messaging, and business management features to streamline operations and enhance efficiency.

---

## ⚡ Features

### 📢 Messaging & Communication

* **Send Bulk Messages** to multiple contacts using CSV files.
* Automatically handles numbers in both standard format and `@uid` format.
* Safe batching to avoid WhatsApp blocking.

### 🔍 Web Scraping & Automation

* Scrape services from the **MakeMeTrend** website services page.
* Extract service names, descriptions, and details for automation or analysis.

### 🛡️ Message Management

* **Recover deleted messages** in groups or private chats.
* Logs deleted messages and shows them to the owner/admin.

### 📱 Status Automation

* **Auto-react** to statuses.
* **Auto-download** statuses for records or reposting.

### 💳 Business & Owner Info

* Retrieve **bank details of the owner** securely.
* Display **owner details** directly in chat.
* View **hosting plan details** and bot subscription info.

### 🔌 Plugin System

* Modular **plugin architecture** allows easy addition of new automation commands.
* Each plugin manages a specific automation task (messaging, scraping, status management, etc.).

---

## 📂 Folder Structure

```
MMT-BUSINESS-HUB/
│
├─ plugins/        # All automation plugins
├─ lib/            # Helper functions & utilities
├─ data/           # CSV files & other data storage
├─ images/         # Assets and media
├─ index.js        # Main bot entry
├─ config.js       # Bot configuration
└─ package.json    # Node.js dependencies
```

---

## 🚀 Getting Started

### Prerequisites

* Node.js v18+
* WhatsApp account
* CSV file(s) of contacts

### Installation

```bash
git clone https://github.com/mmtbusinesshub/MMT.git
cd MMT
npm install
```

### Running the Bot

```bash
node index.js
```

---

## 📌 Notes

* Ensure all **CSV files** are in `/data` folder.
* Use the `.bulk` command for sending messages safely in batches.
* Only the **owner/admin** can use sensitive commands (recover messages, get bank info, etc.).

---

## 💬 Contact / Support

* [GitHub Issues](https://github.com/mmtbusinesshub/MMT/issues)
* Contact the bot owner for business or automation inquiries.

---

## 📝 License

This project is licensed under the MIT License.
