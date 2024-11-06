# ADM Emulator

Structured Workspace for Android Device Manager, Decompilers and other Reverse Engineering tools.

This project is based on [tango-adb/old-demo](https://github.com/tango-adb/old-demo) which gives API Reference for using [tango](https://github.com/yume-chan/ya-webadb). It uses a subset of features provided by the library to manage and connect to emulators using WebSockets.

## Submodules

- adm: tango-adb old-demo client (with Frida Support `WIP`)
- dev-tools: decompilers, shellcode repository
- manager: webapp to manage multiple devices connected to the server
- other packages required for adm

## Setup

1. Clone the repo

```sh
git clone https://github.com/dev-rvk/ADM-V3
cd ADM-V3
```

2. Install dependancies

```sh
pnpm install
```

3. Run in developement environment

```sh
pnpm recursive run build
pnpm recursive run dev                                           
```

## Build

```sh
pnpm install
pnpm recursive run build
```

## Generate static build that can be hosted on GitHub Pages

This project was built using `Next.js`
However, since it doesn't have any server-side code, the most simple deployment method is to use the [Static HTML Export](https://nextjs.org/docs/advanced-features/static-html-export) feature of Next.js. It generates pre-rendered, fully static HTML files, that can be deployed to any static website hosting services (e.g. GitHub Pages).

To export static deployable HTML files, after running `rush build` command, run:

```sh
cd packages/adm
npx next export
```

This will create an `out` folder containing exported HTML files and all required resource files.

## Features

- Device Management: Supports multiple devices connected via adb over wifi to the server, and their access through the tango-adb old-demo app
  
- Static Analysis
  - Ghidra, Angr Decompilers
  - JadX apk Decompiler

- Dynamic Analysis
  - Run scripts using Frida (`WIP`)

- Shell Code Repository
- Compile & Deploy shell codes (`WIP`)

- File Management
  - List
  - Upload
  - Download
  - Delete
  - Preview image files
- Screen Capture
- Terminal Emulator powered by [Tabby](https://github.com/Eugeny/tabby)
  - Tabs and split panes
  - Color themes
  - Rich configuration
- Install APK
- [Scrcpy](https://github.com/Genymobile/scrcpy) compatible client
  - Screen mirroring
  - Audio forwarding (Android >= 11)
  - Recording
  - Control device with mouse, touch and keyboard
- Monitor and dump logcat messages
- Power off and reboot to different modes

## Used open-source projects

- [ADB](https://android.googlesource.com/platform/packages/modules/adb) from Google ([Apache License 2.0](./adb.NOTICE))
- [Scrcpy](https://github.com/Genymobile/scrcpy) from Romain Vimont ([Apache License 2.0](https://github.com/Genymobile/scrcpy/blob/master/LICENSE))
- [Tabby](https://github.com/Eugeny/tabby) from Eugeny ([MIT License](https://github.com/Eugeny/tabby/blob/master/LICENSE))
- [webm-muxer](https://github.com/Vanilagy/webm-muxer) from Vanilagy ([MIT License](https://github.com/Vanilagy/webm-muxer/blob/main/LICENSE))
- [web-streams-polyfill](https://github.com/MattiasBuelens/web-streams-polyfill) from Mattias Buelens ([MIT License](https://github.com/MattiasBuelens/web-streams-polyfill/blob/master/LICENSE))
