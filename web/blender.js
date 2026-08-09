// include: shell.js
// include: minimum_runtime_check.js
(function() {
  // "30.0.0" -> 300000
  function humanReadableVersionToPacked(str) {
    str = str.split("-")[0];
    // Remove any trailing part from e.g. "12.53.3-alpha"
    var vers = str.split(".").slice(0, 3);
    while (vers.length < 3) vers.push("00");
    vers = vers.map((n, i, arr) => n.padStart(2, "0"));
    return vers.join("");
  }
  // 300000 -> "30.0.0"
  var packedVersionToHumanReadable = n => [ n / 1e4 | 0, (n / 100 | 0) % 100, n % 100 ].join(".");
  var TARGET_NOT_SUPPORTED = 2147483647;
  // Note: We use a typeof check here instead of optional chaining using
  // globalThis because older browsers might not have globalThis defined.
  var currentNodeVersion = typeof process !== "undefined" && process.versions?.node ? humanReadableVersionToPacked(process.versions.node) : TARGET_NOT_SUPPORTED;
  if (currentNodeVersion < TARGET_NOT_SUPPORTED) {
    throw new Error("not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)");
  }
  if (currentNodeVersion < 2147483647) {
    throw new Error(`This emscripten-generated code requires node v${packedVersionToHumanReadable(2147483647)} (detected v${packedVersionToHumanReadable(currentNodeVersion)})`);
  }
  var userAgent = typeof navigator !== "undefined" && navigator.userAgent;
  if (!userAgent) {
    return;
  }
  var currentSafariVersion = userAgent.includes("Safari/") && !userAgent.includes("Chrome/") && userAgent.match(/Version\/(\d+\.?\d*\.?\d*)/) ? humanReadableVersionToPacked(userAgent.match(/Version\/(\d+\.?\d*\.?\d*)/)[1]) : TARGET_NOT_SUPPORTED;
  if (currentSafariVersion < 15e4) {
    throw new Error(`This emscripten-generated code requires Safari v${packedVersionToHumanReadable(15e4)} (detected v${currentSafariVersion})`);
  }
  var currentFirefoxVersion = userAgent.match(/Firefox\/(\d+(?:\.\d+)?)/) ? parseFloat(userAgent.match(/Firefox\/(\d+(?:\.\d+)?)/)[1]) : TARGET_NOT_SUPPORTED;
  if (currentFirefoxVersion < 79) {
    throw new Error(`This emscripten-generated code requires Firefox v79 (detected v${currentFirefoxVersion})`);
  }
  var currentChromeVersion = userAgent.match(/Chrome\/(\d+(?:\.\d+)?)/) ? parseFloat(userAgent.match(/Chrome\/(\d+(?:\.\d+)?)/)[1]) : TARGET_NOT_SUPPORTED;
  if (currentChromeVersion < 85) {
    throw new Error(`This emscripten-generated code requires Chrome v85 (detected v${currentChromeVersion})`);
  }
})();

// end include: minimum_runtime_check.js
// The Module object: Our interface to the outside world. We import
// and export values on it. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(moduleArg) => Promise<Module>
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to check if Module already exists (e.g. case 3 above).
// Substitution will be replaced with actual code on later stage of the build,
// this way Closure Compiler will not mangle it (e.g. case 4. above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module = typeof Module != "undefined" ? Module : {};

// Determine the runtime environment we are in. You can customize this by
// setting the ENVIRONMENT setting at compile time (see settings.js).
// Attempt to auto-detect the environment
var ENVIRONMENT_IS_WEB = !!globalThis.window;

var ENVIRONMENT_IS_WORKER = !!globalThis.WorkerGlobalScope;

// N.b. Electron.js environment is simultaneously a NODE-environment, but
// also a web environment.
var ENVIRONMENT_IS_NODE = globalThis.process?.versions?.node && globalThis.process?.type != "renderer";

var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;

// Three configurations we can be running in:
// 1) We could be the application main() thread running in the main JS UI thread. (ENVIRONMENT_IS_WORKER == false and ENVIRONMENT_IS_PTHREAD == false)
// 2) We could be the application main() running directly in a worker. (ENVIRONMENT_IS_WORKER == true, ENVIRONMENT_IS_PTHREAD == false)
// 3) We could be an application pthread running in a worker. (ENVIRONMENT_IS_WORKER == true and ENVIRONMENT_IS_PTHREAD == true)
// The way we signal to a worker that it is hosting a pthread is to construct
// it with a specific name.
var ENVIRONMENT_IS_PTHREAD = ENVIRONMENT_IS_WORKER && globalThis.name?.startsWith("em-pthread");

// --pre-jses are emitted after the Module integration code, so that they can
// refer to Module (if they choose; they can also define Module)
// include: /tmp/tmp_ar6pv86.js
if (!Module["expectedDataFileDownloads"]) Module["expectedDataFileDownloads"] = 0;

Module["expectedDataFileDownloads"]++;

(() => {
  // Do not attempt to redownload the virtual filesystem data when in a pthread or a Wasm Worker context.
  var isPthread = typeof ENVIRONMENT_IS_PTHREAD != "undefined" && ENVIRONMENT_IS_PTHREAD;
  var isWasmWorker = typeof ENVIRONMENT_IS_WASM_WORKER != "undefined" && ENVIRONMENT_IS_WASM_WORKER;
  if (isPthread || isWasmWorker) return;
  async function loadPackage(metadata) {
    var PACKAGE_PATH = "";
    if (typeof window === "object") {
      PACKAGE_PATH = window["encodeURIComponent"](window.location.pathname.substring(0, window.location.pathname.lastIndexOf("/")) + "/");
    } else if (typeof process === "undefined" && typeof location !== "undefined") {
      // web worker
      PACKAGE_PATH = encodeURIComponent(location.pathname.substring(0, location.pathname.lastIndexOf("/")) + "/");
    }
    var PACKAGE_NAME = "/nas/Temp/repos/blender-wasm-fork/web/blender.data";
    var REMOTE_PACKAGE_BASE = "blender.data";
    var REMOTE_PACKAGE_NAME = Module["locateFile"] ? Module["locateFile"](REMOTE_PACKAGE_BASE, "") : REMOTE_PACKAGE_BASE;
    var REMOTE_PACKAGE_SIZE = metadata["remote_package_size"];
    async function fetchRemotePackage(packageName, packageSize) {
      if (!Module["dataFileDownloads"]) Module["dataFileDownloads"] = {};
      try {
        var response = await fetch(packageName);
      } catch (e) {
        throw new Error(`Network Error: ${packageName}`, {
          e
        });
      }
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.url}`);
      }
      const chunks = [];
      const headers = response.headers;
      const total = Number(headers.get("Content-Length") || packageSize);
      let loaded = 0;
      Module["setStatus"] && Module["setStatus"]("Downloading data...");
      const reader = response.body.getReader();
      while (1) {
        var {done, value} = await reader.read();
        if (done) break;
        chunks.push(value);
        loaded += value.length;
        Module["dataFileDownloads"][packageName] = {
          loaded,
          total
        };
        let totalLoaded = 0;
        let totalSize = 0;
        for (const download of Object.values(Module["dataFileDownloads"])) {
          totalLoaded += download.loaded;
          totalSize += download.total;
        }
        Module["setStatus"] && Module["setStatus"](`Downloading data... (${totalLoaded}/${totalSize})`);
      }
      const packageData = new Uint8Array(chunks.map(c => c.length).reduce((a, b) => a + b, 0));
      let offset = 0;
      for (const chunk of chunks) {
        packageData.set(chunk, offset);
        offset += chunk.length;
      }
      return packageData.buffer;
    }
    var fetchPromise;
    var fetched = Module["getPreloadedPackage"] && Module["getPreloadedPackage"](REMOTE_PACKAGE_NAME, REMOTE_PACKAGE_SIZE);
    if (!fetched) {
      // Note that we don't use await here because we want to execute the
      // the rest of this function immediately.
      fetchPromise = fetchRemotePackage(REMOTE_PACKAGE_NAME, REMOTE_PACKAGE_SIZE);
    }
    async function runWithFS(Module) {
      function assert(check, msg) {
        if (!check) throw new Error(msg);
      }
      Module["FS_createPath"]("/", "5.3", true, true);
      Module["FS_createPath"]("/5.3", "datafiles", true, true);
      Module["FS_createPath"]("/5.3/datafiles", "colormanagement", true, true);
      Module["FS_createPath"]("/5.3/datafiles/colormanagement", "filmic", true, true);
      Module["FS_createPath"]("/5.3/datafiles/colormanagement", "icc", true, true);
      Module["FS_createPath"]("/5.3/datafiles/colormanagement", "luts", true, true);
      Module["FS_createPath"]("/5.3/datafiles", "cursors", true, true);
      Module["FS_createPath"]("/5.3/datafiles", "fonts", true, true);
      Module["FS_createPath"]("/5.3/datafiles", "icons", true, true);
      Module["FS_createPath"]("/5.3/datafiles", "icons_blend", true, true);
      Module["FS_createPath"]("/5.3/datafiles", "icons_svg", true, true);
      Module["FS_createPath"]("/5.3/datafiles", "studiolights", true, true);
      Module["FS_createPath"]("/5.3/datafiles/studiolights", "matcap", true, true);
      Module["FS_createPath"]("/5.3/datafiles/studiolights", "studio", true, true);
      Module["FS_createPath"]("/5.3/datafiles/studiolights", "world", true, true);
      Module["FS_createPath"]("/5.3/datafiles", "userdef", true, true);
      Module["FS_createPath"]("/5.3", "scripts", true, true);
      Module["FS_createPath"]("/5.3/scripts", "addons_core", true, true);
      Module["FS_createPath"]("/5.3/scripts/addons_core", "bl_pkg", true, true);
      Module["FS_createPath"]("/5.3/scripts/addons_core/bl_pkg", "cli", true, true);
      Module["FS_createPath"]("/5.3/scripts/addons_core/bl_pkg", "example_extension", true, true);
      Module["FS_createPath"]("/5.3/scripts/addons_core/bl_pkg", "tests", true, true);
      Module["FS_createPath"]("/5.3/scripts/addons_core/bl_pkg/tests", "modules", true, true);
      Module["FS_createPath"]("/5.3/scripts/addons_core", "hydra_storm", true, true);
      Module["FS_createPath"]("/5.3/scripts/addons_core", "io_anim_bvh", true, true);
      Module["FS_createPath"]("/5.3/scripts/addons_core", "io_curve_svg", true, true);
      Module["FS_createPath"]("/5.3/scripts/addons_core", "io_mesh_uv_layout", true, true);
      Module["FS_createPath"]("/5.3/scripts/addons_core", "io_scene_fbx", true, true);
      Module["FS_createPath"]("/5.3/scripts/addons_core", "io_scene_gltf2", true, true);
      Module["FS_createPath"]("/5.3/scripts/addons_core/io_scene_gltf2", "blender", true, true);
      Module["FS_createPath"]("/5.3/scripts/addons_core/io_scene_gltf2/blender", "com", true, true);
      Module["FS_createPath"]("/5.3/scripts/addons_core/io_scene_gltf2/blender", "exp", true, true);
      Module["FS_createPath"]("/5.3/scripts/addons_core/io_scene_gltf2/blender/exp", "animation", true, true);
      Module["FS_createPath"]("/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/animation", "fcurves", true, true);
      Module["FS_createPath"]("/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/animation", "sampled", true, true);
      Module["FS_createPath"]("/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/animation/sampled", "armature", true, true);
      Module["FS_createPath"]("/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/animation/sampled", "data", true, true);
      Module["FS_createPath"]("/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/animation/sampled", "object", true, true);
      Module["FS_createPath"]("/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/animation/sampled", "shapekeys", true, true);
      Module["FS_createPath"]("/5.3/scripts/addons_core/io_scene_gltf2/blender/exp", "material", true, true);
      Module["FS_createPath"]("/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/material", "extensions", true, true);
      Module["FS_createPath"]("/5.3/scripts/addons_core/io_scene_gltf2/blender", "imp", true, true);
      Module["FS_createPath"]("/5.3/scripts/addons_core/io_scene_gltf2", "io", true, true);
      Module["FS_createPath"]("/5.3/scripts/addons_core/io_scene_gltf2/io", "com", true, true);
      Module["FS_createPath"]("/5.3/scripts/addons_core/io_scene_gltf2/io", "exp", true, true);
      Module["FS_createPath"]("/5.3/scripts/addons_core/io_scene_gltf2/io", "imp", true, true);
      Module["FS_createPath"]("/5.3/scripts/addons_core", "node_wrangler", true, true);
      Module["FS_createPath"]("/5.3/scripts/addons_core/node_wrangler", "operators", true, true);
      Module["FS_createPath"]("/5.3/scripts/addons_core/node_wrangler", "utils", true, true);
      Module["FS_createPath"]("/5.3/scripts/addons_core", "pose_library", true, true);
      Module["FS_createPath"]("/5.3/scripts/addons_core", "rigify", true, true);
      Module["FS_createPath"]("/5.3/scripts/addons_core/rigify", "feature_sets", true, true);
      Module["FS_createPath"]("/5.3/scripts/addons_core/rigify", "metarigs", true, true);
      Module["FS_createPath"]("/5.3/scripts/addons_core/rigify/metarigs", "Animals", true, true);
      Module["FS_createPath"]("/5.3/scripts/addons_core/rigify/metarigs", "Basic", true, true);
      Module["FS_createPath"]("/5.3/scripts/addons_core/rigify", "operators", true, true);
      Module["FS_createPath"]("/5.3/scripts/addons_core/rigify", "rigs", true, true);
      Module["FS_createPath"]("/5.3/scripts/addons_core/rigify/rigs", "basic", true, true);
      Module["FS_createPath"]("/5.3/scripts/addons_core/rigify/rigs", "experimental", true, true);
      Module["FS_createPath"]("/5.3/scripts/addons_core/rigify/rigs", "face", true, true);
      Module["FS_createPath"]("/5.3/scripts/addons_core/rigify/rigs", "faces", true, true);
      Module["FS_createPath"]("/5.3/scripts/addons_core/rigify/rigs", "limbs", true, true);
      Module["FS_createPath"]("/5.3/scripts/addons_core/rigify/rigs", "skin", true, true);
      Module["FS_createPath"]("/5.3/scripts/addons_core/rigify/rigs/skin", "transform", true, true);
      Module["FS_createPath"]("/5.3/scripts/addons_core/rigify/rigs", "spines", true, true);
      Module["FS_createPath"]("/5.3/scripts/addons_core/rigify", "utils", true, true);
      Module["FS_createPath"]("/5.3/scripts/addons_core", "ui_translate", true, true);
      Module["FS_createPath"]("/5.3/scripts/addons_core", "viewport_vr_preview", true, true);
      Module["FS_createPath"]("/5.3/scripts/addons_core/viewport_vr_preview", "configs", true, true);
      Module["FS_createPath"]("/5.3/scripts", "freestyle", true, true);
      Module["FS_createPath"]("/5.3/scripts/freestyle", "modules", true, true);
      Module["FS_createPath"]("/5.3/scripts/freestyle/modules", "freestyle", true, true);
      Module["FS_createPath"]("/5.3/scripts/freestyle", "styles", true, true);
      Module["FS_createPath"]("/5.3/scripts", "modules", true, true);
      Module["FS_createPath"]("/5.3/scripts/modules", "_bl_console_utils", true, true);
      Module["FS_createPath"]("/5.3/scripts/modules/_bl_console_utils", "autocomplete", true, true);
      Module["FS_createPath"]("/5.3/scripts/modules", "_bl_i18n_utils", true, true);
      Module["FS_createPath"]("/5.3/scripts/modules", "_bl_previews_utils", true, true);
      Module["FS_createPath"]("/5.3/scripts/modules", "_bl_rna_utils", true, true);
      Module["FS_createPath"]("/5.3/scripts/modules", "_bl_text_utils", true, true);
      Module["FS_createPath"]("/5.3/scripts/modules", "_bl_ui_utils", true, true);
      Module["FS_createPath"]("/5.3/scripts/modules", "_bpy_internal", true, true);
      Module["FS_createPath"]("/5.3/scripts/modules/_bpy_internal", "addons", true, true);
      Module["FS_createPath"]("/5.3/scripts/modules/_bpy_internal", "assets", true, true);
      Module["FS_createPath"]("/5.3/scripts/modules/_bpy_internal/assets", "remote_library", true, true);
      Module["FS_createPath"]("/5.3/scripts/modules/_bpy_internal", "disk_file_hash_service", true, true);
      Module["FS_createPath"]("/5.3/scripts/modules/_bpy_internal", "extensions", true, true);
      Module["FS_createPath"]("/5.3/scripts/modules/_bpy_internal", "filesystem", true, true);
      Module["FS_createPath"]("/5.3/scripts/modules/_bpy_internal", "grease_pencil", true, true);
      Module["FS_createPath"]("/5.3/scripts/modules/_bpy_internal", "http", true, true);
      Module["FS_createPath"]("/5.3/scripts/modules/_bpy_internal", "platform", true, true);
      Module["FS_createPath"]("/5.3/scripts/modules/_bpy_internal", "system_info", true, true);
      Module["FS_createPath"]("/5.3/scripts/modules", "bl_app_override", true, true);
      Module["FS_createPath"]("/5.3/scripts/modules", "bl_keymap_utils", true, true);
      Module["FS_createPath"]("/5.3/scripts/modules", "bpy", true, true);
      Module["FS_createPath"]("/5.3/scripts/modules/bpy", "utils", true, true);
      Module["FS_createPath"]("/5.3/scripts/modules", "bpy_extras", true, true);
      Module["FS_createPath"]("/5.3/scripts/modules/bpy_extras", "wm_utils", true, true);
      Module["FS_createPath"]("/5.3/scripts/modules", "gpu_extras", true, true);
      Module["FS_createPath"]("/5.3/scripts", "presets", true, true);
      Module["FS_createPath"]("/5.3/scripts/presets", "camera", true, true);
      Module["FS_createPath"]("/5.3/scripts/presets", "cloth", true, true);
      Module["FS_createPath"]("/5.3/scripts/presets", "color_management", true, true);
      Module["FS_createPath"]("/5.3/scripts/presets/color_management", "white_balance", true, true);
      Module["FS_createPath"]("/5.3/scripts/presets", "cycles", true, true);
      Module["FS_createPath"]("/5.3/scripts/presets/cycles", "integrator", true, true);
      Module["FS_createPath"]("/5.3/scripts/presets/cycles", "performance", true, true);
      Module["FS_createPath"]("/5.3/scripts/presets/cycles", "sampling", true, true);
      Module["FS_createPath"]("/5.3/scripts/presets/cycles", "viewport_sampling", true, true);
      Module["FS_createPath"]("/5.3/scripts/presets", "eevee", true, true);
      Module["FS_createPath"]("/5.3/scripts/presets/eevee", "raytracing", true, true);
      Module["FS_createPath"]("/5.3/scripts/presets", "ffmpeg", true, true);
      Module["FS_createPath"]("/5.3/scripts/presets", "fluid", true, true);
      Module["FS_createPath"]("/5.3/scripts/presets", "framerate", true, true);
      Module["FS_createPath"]("/5.3/scripts/presets", "gpencil_material", true, true);
      Module["FS_createPath"]("/5.3/scripts/presets", "hair_dynamics", true, true);
      Module["FS_createPath"]("/5.3/scripts/presets", "interface_theme", true, true);
      Module["FS_createPath"]("/5.3/scripts/presets", "keyconfig", true, true);
      Module["FS_createPath"]("/5.3/scripts/presets/keyconfig", "keymap_data", true, true);
      Module["FS_createPath"]("/5.3/scripts/presets", "pixel_density", true, true);
      Module["FS_createPath"]("/5.3/scripts/presets", "render", true, true);
      Module["FS_createPath"]("/5.3/scripts/presets", "safe_areas", true, true);
      Module["FS_createPath"]("/5.3/scripts/presets", "sequencer", true, true);
      Module["FS_createPath"]("/5.3/scripts/presets/sequencer", "text_style", true, true);
      Module["FS_createPath"]("/5.3/scripts/presets", "text_editor", true, true);
      Module["FS_createPath"]("/5.3/scripts/presets", "tracking_camera", true, true);
      Module["FS_createPath"]("/5.3/scripts/presets", "tracking_settings", true, true);
      Module["FS_createPath"]("/5.3/scripts/presets", "tracking_track_color", true, true);
      Module["FS_createPath"]("/5.3/scripts", "site", true, true);
      Module["FS_createPath"]("/5.3/scripts", "startup", true, true);
      Module["FS_createPath"]("/5.3/scripts/startup", "bl_app_templates_system", true, true);
      Module["FS_createPath"]("/5.3/scripts/startup/bl_app_templates_system", "2D_Animation", true, true);
      Module["FS_createPath"]("/5.3/scripts/startup/bl_app_templates_system", "Sculpting", true, true);
      Module["FS_createPath"]("/5.3/scripts/startup/bl_app_templates_system", "Storyboarding", true, true);
      Module["FS_createPath"]("/5.3/scripts/startup/bl_app_templates_system", "VFX", true, true);
      Module["FS_createPath"]("/5.3/scripts/startup/bl_app_templates_system", "Video_Editing", true, true);
      Module["FS_createPath"]("/5.3/scripts/startup", "bl_operators", true, true);
      Module["FS_createPath"]("/5.3/scripts/startup/bl_operators", "bmesh", true, true);
      Module["FS_createPath"]("/5.3/scripts/startup/bl_operators", "node_editor", true, true);
      Module["FS_createPath"]("/5.3/scripts/startup", "bl_ui", true, true);
      Module["FS_createPath"]("/5.3/scripts", "templates_osl", true, true);
      Module["FS_createPath"]("/5.3/scripts", "templates_py", true, true);
      Module["FS_createPath"]("/5.3/scripts/templates_py", "Gizmo", true, true);
      Module["FS_createPath"]("/5.3/scripts/templates_py", "Operator", true, true);
      Module["FS_createPath"]("/5.3/scripts/templates_py", "UI", true, true);
      Module["FS_createPath"]("/5.3/scripts", "templates_toml", true, true);
      Module["FS_createPath"]("/", "nas", true, true);
      Module["FS_createPath"]("/nas", "Temp", true, true);
      Module["FS_createPath"]("/nas/Temp", "repos", true, true);
      Module["FS_createPath"]("/nas/Temp/repos", "blender-wasm-fork", true, true);
      Module["FS_createPath"]("/nas/Temp/repos/blender-wasm-fork", "wasm-sysroot", true, true);
      Module["FS_createPath"]("/nas/Temp/repos/blender-wasm-fork/wasm-sysroot", "lib", true, true);
      Module["FS_createPath"]("/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib", "python3.13", true, true);
      Module["FS_createPath"]("/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13", "__phello__", true, true);
      Module["FS_createPath"]("/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13", "_pyrepl", true, true);
      Module["FS_createPath"]("/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13", "asyncio", true, true);
      Module["FS_createPath"]("/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13", "collections", true, true);
      Module["FS_createPath"]("/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13", "concurrent", true, true);
      Module["FS_createPath"]("/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/concurrent", "futures", true, true);
      Module["FS_createPath"]("/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13", "ctypes", true, true);
      Module["FS_createPath"]("/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/ctypes", "macholib", true, true);
      Module["FS_createPath"]("/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13", "curses", true, true);
      Module["FS_createPath"]("/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13", "dbm", true, true);
      Module["FS_createPath"]("/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13", "email", true, true);
      Module["FS_createPath"]("/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/email", "mime", true, true);
      Module["FS_createPath"]("/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13", "encodings", true, true);
      Module["FS_createPath"]("/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13", "html", true, true);
      Module["FS_createPath"]("/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13", "http", true, true);
      Module["FS_createPath"]("/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13", "importlib", true, true);
      Module["FS_createPath"]("/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/importlib", "metadata", true, true);
      Module["FS_createPath"]("/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/importlib", "resources", true, true);
      Module["FS_createPath"]("/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13", "json", true, true);
      Module["FS_createPath"]("/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13", "logging", true, true);
      Module["FS_createPath"]("/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13", "multiprocessing", true, true);
      Module["FS_createPath"]("/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/multiprocessing", "dummy", true, true);
      Module["FS_createPath"]("/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13", "pathlib", true, true);
      Module["FS_createPath"]("/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13", "pydoc_data", true, true);
      Module["FS_createPath"]("/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13", "re", true, true);
      Module["FS_createPath"]("/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13", "site-packages", true, true);
      Module["FS_createPath"]("/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13", "sqlite3", true, true);
      Module["FS_createPath"]("/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13", "sysconfig", true, true);
      Module["FS_createPath"]("/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13", "tomllib", true, true);
      Module["FS_createPath"]("/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13", "unittest", true, true);
      Module["FS_createPath"]("/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13", "urllib", true, true);
      Module["FS_createPath"]("/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13", "venv", true, true);
      Module["FS_createPath"]("/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/venv", "scripts", true, true);
      Module["FS_createPath"]("/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/venv/scripts", "common", true, true);
      Module["FS_createPath"]("/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/venv/scripts", "posix", true, true);
      Module["FS_createPath"]("/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13", "wsgiref", true, true);
      Module["FS_createPath"]("/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13", "xml", true, true);
      Module["FS_createPath"]("/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/xml", "dom", true, true);
      Module["FS_createPath"]("/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/xml", "etree", true, true);
      Module["FS_createPath"]("/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/xml", "parsers", true, true);
      Module["FS_createPath"]("/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/xml", "sax", true, true);
      Module["FS_createPath"]("/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13", "xmlrpc", true, true);
      Module["FS_createPath"]("/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13", "zipfile", true, true);
      Module["FS_createPath"]("/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/zipfile", "_path", true, true);
      Module["FS_createPath"]("/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13", "zoneinfo", true, true);
      async function processPackageData(arrayBuffer) {
        assert(arrayBuffer, "Loading data file failed.");
        assert(arrayBuffer.constructor.name === ArrayBuffer.name, "bad input to processPackageData " + arrayBuffer.constructor.name);
        var byteArray = new Uint8Array(arrayBuffer);
        var curr;
        // Reuse the bytearray from the XHR as the source for file reads.
        for (var file of metadata["files"]) {
          var name = file["filename"];
          var data = byteArray.subarray(file["start"], file["end"]);
          // canOwn this data in the filesystem, it is a slice into the heap that will never change
          Module["FS_createDataFile"](name, null, data, true, true, true);
        }
        Module["removeRunDependency"]("datafile_/nas/Temp/repos/blender-wasm-fork/web/blender.data");
      }
      Module["addRunDependency"]("datafile_/nas/Temp/repos/blender-wasm-fork/web/blender.data");
      if (!Module["preloadResults"]) Module["preloadResults"] = {};
      Module["preloadResults"][PACKAGE_NAME] = {
        fromCache: false
      };
      if (!fetched) {
        fetched = await fetchPromise;
      }
      await processPackageData(fetched);
    }
    // Detect whether the module JS file has already been loaded.
    if (Module["FS_createPath"]) {
      runWithFS(Module);
    } else {
      if (!Module["preRun"]) Module["preRun"] = [];
      Module["preRun"].push(runWithFS);
    }
  }
  loadPackage({
    "files": [ {
      "filename": "/5.3/datafiles/DejaVuSans-Lite.sfd.bz2",
      "start": 0,
      "end": 182524
    }, {
      "filename": "/5.3/datafiles/bfont.pfb",
      "start": 182524,
      "end": 207705
    }, {
      "filename": "/5.3/datafiles/blender_icons_geom.py",
      "start": 207705,
      "end": 218411
    }, {
      "filename": "/5.3/datafiles/blender_icons_geom_update.py",
      "start": 218411,
      "end": 222159
    }, {
      "filename": "/5.3/datafiles/colormanagement/config.ocio",
      "start": 222159,
      "end": 284508
    }, {
      "filename": "/5.3/datafiles/colormanagement/filmic/filmic_desat_33.cube",
      "start": 284508,
      "end": 1362757
    }, {
      "filename": "/5.3/datafiles/colormanagement/filmic/filmic_to_0-35_1-30.spi1d",
      "start": 1362757,
      "end": 1457027
    }, {
      "filename": "/5.3/datafiles/colormanagement/filmic/filmic_to_0-48_1-09.spi1d",
      "start": 1457027,
      "end": 1551297
    }, {
      "filename": "/5.3/datafiles/colormanagement/filmic/filmic_to_0-60_1-04.spi1d",
      "start": 1551297,
      "end": 1645567
    }, {
      "filename": "/5.3/datafiles/colormanagement/filmic/filmic_to_0-70_1-03.spi1d",
      "start": 1645567,
      "end": 1739837
    }, {
      "filename": "/5.3/datafiles/colormanagement/filmic/filmic_to_0-85_1-011.spi1d",
      "start": 1739837,
      "end": 1834107
    }, {
      "filename": "/5.3/datafiles/colormanagement/filmic/filmic_to_0.99_1-0075.spi1d",
      "start": 1834107,
      "end": 1928377
    }, {
      "filename": "/5.3/datafiles/colormanagement/filmic/filmic_to_1.20_1-00.spi1d",
      "start": 1928377,
      "end": 2022647
    }, {
      "filename": "/5.3/datafiles/colormanagement/icc/README.md",
      "start": 2022647,
      "end": 2022867
    }, {
      "filename": "/5.3/datafiles/colormanagement/icc/g24_rec2020_display.icc",
      "start": 2022867,
      "end": 2023331
    }, {
      "filename": "/5.3/datafiles/colormanagement/icc/g24_rec709_display.icc",
      "start": 2023331,
      "end": 2023927
    }, {
      "filename": "/5.3/datafiles/colormanagement/icc/g26_xyzd65_display.icc",
      "start": 2023927,
      "end": 2024391
    }, {
      "filename": "/5.3/datafiles/colormanagement/icc/srgb_p3d65_display.icc",
      "start": 2024391,
      "end": 2024871
    }, {
      "filename": "/5.3/datafiles/colormanagement/luts/AgX_Base_Rec2020.cube",
      "start": 2024871,
      "end": 4833978
    }, {
      "filename": "/5.3/datafiles/colormanagement/luts/AgX_Base_sRGB.cube",
      "start": 4833978,
      "end": 7550184
    }, {
      "filename": "/5.3/datafiles/colormanagement/luts/AgX_False_Color.spi1d",
      "start": 7550184,
      "end": 7677224
    }, {
      "filename": "/5.3/datafiles/colormanagement/luts/Guard_Rail_Shaper_EOTF.spi1d",
      "start": 7677224,
      "end": 7722990
    }, {
      "filename": "/5.3/datafiles/colormanagement/luts/luminance_compensation_bt2020.cube",
      "start": 7722990,
      "end": 9242946
    }, {
      "filename": "/5.3/datafiles/colormanagement/luts/xyz_E_to_D65.spimtx",
      "start": 9242946,
      "end": 9243061
    }, {
      "filename": "/5.3/datafiles/ctodata.py",
      "start": 9243061,
      "end": 9244404
    }, {
      "filename": "/5.3/datafiles/cursors/cursor_blade.svg",
      "start": 9244404,
      "end": 9251568
    }, {
      "filename": "/5.3/datafiles/cursors/cursor_both_handles.svg",
      "start": 9251568,
      "end": 9262903
    }, {
      "filename": "/5.3/datafiles/cursors/cursor_crossc.svg",
      "start": 9262903,
      "end": 9273139
    }, {
      "filename": "/5.3/datafiles/cursors/cursor_crosshair.svg",
      "start": 9273139,
      "end": 9279273
    }, {
      "filename": "/5.3/datafiles/cursors/cursor_dot.svg",
      "start": 9279273,
      "end": 9283086
    }, {
      "filename": "/5.3/datafiles/cursors/cursor_e_arrow.svg",
      "start": 9283086,
      "end": 9287638
    }, {
      "filename": "/5.3/datafiles/cursors/cursor_eraser.svg",
      "start": 9287638,
      "end": 9291805
    }, {
      "filename": "/5.3/datafiles/cursors/cursor_ew_scroll.svg",
      "start": 9291805,
      "end": 9296358
    }, {
      "filename": "/5.3/datafiles/cursors/cursor_eyedropper.svg",
      "start": 9296358,
      "end": 9301504
    }, {
      "filename": "/5.3/datafiles/cursors/cursor_h_split.svg",
      "start": 9301504,
      "end": 9306819
    }, {
      "filename": "/5.3/datafiles/cursors/cursor_hand.svg",
      "start": 9306819,
      "end": 9316535
    }, {
      "filename": "/5.3/datafiles/cursors/cursor_hand_closed.svg",
      "start": 9316535,
      "end": 9324560
    }, {
      "filename": "/5.3/datafiles/cursors/cursor_hand_point.svg",
      "start": 9324560,
      "end": 9332674
    }, {
      "filename": "/5.3/datafiles/cursors/cursor_knife.svg",
      "start": 9332674,
      "end": 9336235
    }, {
      "filename": "/5.3/datafiles/cursors/cursor_left_handle.svg",
      "start": 9336235,
      "end": 9346270
    }, {
      "filename": "/5.3/datafiles/cursors/cursor_mute.svg",
      "start": 9346270,
      "end": 9353263
    }, {
      "filename": "/5.3/datafiles/cursors/cursor_n_arrow.svg",
      "start": 9353263,
      "end": 9357522
    }, {
      "filename": "/5.3/datafiles/cursors/cursor_ns_scroll.svg",
      "start": 9357522,
      "end": 9362078
    }, {
      "filename": "/5.3/datafiles/cursors/cursor_nsew_scroll.svg",
      "start": 9362078,
      "end": 9367366
    }, {
      "filename": "/5.3/datafiles/cursors/cursor_paint.svg",
      "start": 9367366,
      "end": 9374251
    }, {
      "filename": "/5.3/datafiles/cursors/cursor_pencil.svg",
      "start": 9374251,
      "end": 9377743
    }, {
      "filename": "/5.3/datafiles/cursors/cursor_pick_area.svg",
      "start": 9377743,
      "end": 9381821
    }, {
      "filename": "/5.3/datafiles/cursors/cursor_pointer.svg",
      "start": 9381821,
      "end": 9384942
    }, {
      "filename": "/5.3/datafiles/cursors/cursor_right_handle.svg",
      "start": 9384942,
      "end": 9394931
    }, {
      "filename": "/5.3/datafiles/cursors/cursor_s_arrow.svg",
      "start": 9394931,
      "end": 9399210
    }, {
      "filename": "/5.3/datafiles/cursors/cursor_slip.svg",
      "start": 9399210,
      "end": 9411534
    }, {
      "filename": "/5.3/datafiles/cursors/cursor_stop.svg",
      "start": 9411534,
      "end": 9415259
    }, {
      "filename": "/5.3/datafiles/cursors/cursor_swap_area.svg",
      "start": 9415259,
      "end": 9419794
    }, {
      "filename": "/5.3/datafiles/cursors/cursor_text_edit.svg",
      "start": 9419794,
      "end": 9424047
    }, {
      "filename": "/5.3/datafiles/cursors/cursor_v_split.svg",
      "start": 9424047,
      "end": 9429363
    }, {
      "filename": "/5.3/datafiles/cursors/cursor_vertex_loop.svg",
      "start": 9429363,
      "end": 9438314
    }, {
      "filename": "/5.3/datafiles/cursors/cursor_w_arrow.svg",
      "start": 9438314,
      "end": 9442691
    }, {
      "filename": "/5.3/datafiles/cursors/cursor_wait.svg",
      "start": 9442691,
      "end": 9446855
    }, {
      "filename": "/5.3/datafiles/cursors/cursor_x_move.svg",
      "start": 9446855,
      "end": 9454162
    }, {
      "filename": "/5.3/datafiles/cursors/cursor_y_move.svg",
      "start": 9454162,
      "end": 9461480
    }, {
      "filename": "/5.3/datafiles/cursors/cursor_zoom_in.svg",
      "start": 9461480,
      "end": 9468709
    }, {
      "filename": "/5.3/datafiles/cursors/cursor_zoom_out.svg",
      "start": 9468709,
      "end": 9475872
    }, {
      "filename": "/5.3/datafiles/fonts/DejaVuSansMono.woff2",
      "start": 9475872,
      "end": 9621064
    }, {
      "filename": "/5.3/datafiles/fonts/Inter.woff2",
      "start": 9621064,
      "end": 9972196
    }, {
      "filename": "/5.3/datafiles/fonts/Noto Sans CJK Regular.woff2",
      "start": 9972196,
      "end": 21397512
    }, {
      "filename": "/5.3/datafiles/fonts/NotoEmoji-VariableFont_wght.woff2",
      "start": 21397512,
      "end": 22441508
    }, {
      "filename": "/5.3/datafiles/fonts/NotoSansArabic-VariableFont_wdth,wght.woff2",
      "start": 22441508,
      "end": 22695004
    }, {
      "filename": "/5.3/datafiles/fonts/NotoSansArmenian-VariableFont_wdth,wght.woff2",
      "start": 22695004,
      "end": 22742496
    }, {
      "filename": "/5.3/datafiles/fonts/NotoSansBengali-VariableFont_wdth,wght.woff2",
      "start": 22742496,
      "end": 22969236
    }, {
      "filename": "/5.3/datafiles/fonts/NotoSansDevanagari-Regular.woff2",
      "start": 22969236,
      "end": 23039108
    }, {
      "filename": "/5.3/datafiles/fonts/NotoSansEthiopic-Regular.woff2",
      "start": 23039108,
      "end": 23131716
    }, {
      "filename": "/5.3/datafiles/fonts/NotoSansGeorgian-VariableFont_wdth,wght.woff2",
      "start": 23131716,
      "end": 23233240
    }, {
      "filename": "/5.3/datafiles/fonts/NotoSansGujarati-Regular.woff2",
      "start": 23233240,
      "end": 23291908
    }, {
      "filename": "/5.3/datafiles/fonts/NotoSansGurmukhi-VariableFont_wdth,wght.woff2",
      "start": 23291908,
      "end": 23358476
    }, {
      "filename": "/5.3/datafiles/fonts/NotoSansHebrew-Regular.woff2",
      "start": 23358476,
      "end": 23376788
    }, {
      "filename": "/5.3/datafiles/fonts/NotoSansJavanese-Regular.woff2",
      "start": 23376788,
      "end": 23410932
    }, {
      "filename": "/5.3/datafiles/fonts/NotoSansKannada-VariableFont_wdth,wght.woff2",
      "start": 23410932,
      "end": 23567192
    }, {
      "filename": "/5.3/datafiles/fonts/NotoSansKhmer-VariableFont_wdth,wght.woff2",
      "start": 23567192,
      "end": 23696708
    }, {
      "filename": "/5.3/datafiles/fonts/NotoSansMalayalam-VariableFont_wdth,wght.woff2",
      "start": 23696708,
      "end": 23856556
    }, {
      "filename": "/5.3/datafiles/fonts/NotoSansMath-Regular.woff2",
      "start": 23856556,
      "end": 24083016
    }, {
      "filename": "/5.3/datafiles/fonts/NotoSansMyanmar-Regular.woff2",
      "start": 24083016,
      "end": 24147708
    }, {
      "filename": "/5.3/datafiles/fonts/NotoSansSymbols-VariableFont_wght.woff2",
      "start": 24147708,
      "end": 24299952
    }, {
      "filename": "/5.3/datafiles/fonts/NotoSansSymbols2-Regular.woff2",
      "start": 24299952,
      "end": 24501276
    }, {
      "filename": "/5.3/datafiles/fonts/NotoSansTamil-VariableFont_wdth,wght.woff2",
      "start": 24501276,
      "end": 24599656
    }, {
      "filename": "/5.3/datafiles/fonts/NotoSansTelugu-VariableFont_wdth,wght.woff2",
      "start": 24599656,
      "end": 24809364
    }, {
      "filename": "/5.3/datafiles/fonts/NotoSansThai-VariableFont_wdth,wght.woff2",
      "start": 24809364,
      "end": 24856216
    }, {
      "filename": "/5.3/datafiles/icons/brush.draw.dat",
      "start": 24856216,
      "end": 24858168
    }, {
      "filename": "/5.3/datafiles/icons/brush.generic.dat",
      "start": 24858168,
      "end": 24859742
    }, {
      "filename": "/5.3/datafiles/icons/brush.gpencil_draw.erase.dat",
      "start": 24859742,
      "end": 24860794
    }, {
      "filename": "/5.3/datafiles/icons/brush.gpencil_draw.fill.dat",
      "start": 24860794,
      "end": 24863070
    }, {
      "filename": "/5.3/datafiles/icons/brush.paint_texture.clone.dat",
      "start": 24863070,
      "end": 24863834
    }, {
      "filename": "/5.3/datafiles/icons/brush.paint_texture.fill.dat",
      "start": 24863834,
      "end": 24866110
    }, {
      "filename": "/5.3/datafiles/icons/brush.paint_texture.mask.dat",
      "start": 24866110,
      "end": 24866586
    }, {
      "filename": "/5.3/datafiles/icons/brush.paint_texture.smear.dat",
      "start": 24866586,
      "end": 24868286
    }, {
      "filename": "/5.3/datafiles/icons/brush.paint_texture.soften.dat",
      "start": 24868286,
      "end": 24869590
    }, {
      "filename": "/5.3/datafiles/icons/brush.paint_vertex.average.dat",
      "start": 24869590,
      "end": 24872874
    }, {
      "filename": "/5.3/datafiles/icons/brush.paint_vertex.blur.dat",
      "start": 24872874,
      "end": 24874178
    }, {
      "filename": "/5.3/datafiles/icons/brush.paint_vertex.replace.dat",
      "start": 24874178,
      "end": 24877120
    }, {
      "filename": "/5.3/datafiles/icons/brush.paint_vertex.smear.dat",
      "start": 24877120,
      "end": 24878820
    }, {
      "filename": "/5.3/datafiles/icons/brush.paint_weight.average.dat",
      "start": 24878820,
      "end": 24882104
    }, {
      "filename": "/5.3/datafiles/icons/brush.paint_weight.blur.dat",
      "start": 24882104,
      "end": 24883408
    }, {
      "filename": "/5.3/datafiles/icons/brush.paint_weight.smear.dat",
      "start": 24883408,
      "end": 24885108
    }, {
      "filename": "/5.3/datafiles/icons/brush.particle.add.dat",
      "start": 24885108,
      "end": 24887240
    }, {
      "filename": "/5.3/datafiles/icons/brush.particle.comb.dat",
      "start": 24887240,
      "end": 24891712
    }, {
      "filename": "/5.3/datafiles/icons/brush.particle.cut.dat",
      "start": 24891712,
      "end": 24894168
    }, {
      "filename": "/5.3/datafiles/icons/brush.particle.length.dat",
      "start": 24894168,
      "end": 24895904
    }, {
      "filename": "/5.3/datafiles/icons/brush.particle.puff.dat",
      "start": 24895904,
      "end": 24897622
    }, {
      "filename": "/5.3/datafiles/icons/brush.particle.smooth.dat",
      "start": 24897622,
      "end": 24898368
    }, {
      "filename": "/5.3/datafiles/icons/brush.particle.weight.dat",
      "start": 24898368,
      "end": 24901292
    }, {
      "filename": "/5.3/datafiles/icons/brush.sculpt.dat",
      "start": 24901292,
      "end": 24903226
    }, {
      "filename": "/5.3/datafiles/icons/brush.sculpt.displacement_eraser.dat",
      "start": 24903226,
      "end": 24906330
    }, {
      "filename": "/5.3/datafiles/icons/brush.sculpt.displacement_smear.dat",
      "start": 24906330,
      "end": 24910298
    }, {
      "filename": "/5.3/datafiles/icons/brush.sculpt.draw_face_sets.dat",
      "start": 24910298,
      "end": 24913564
    }, {
      "filename": "/5.3/datafiles/icons/brush.sculpt.mask.dat",
      "start": 24913564,
      "end": 24916830
    }, {
      "filename": "/5.3/datafiles/icons/brush.sculpt.paint.dat",
      "start": 24916830,
      "end": 24918404
    }, {
      "filename": "/5.3/datafiles/icons/brush.sculpt.simplify.dat",
      "start": 24918404,
      "end": 24923884
    }, {
      "filename": "/5.3/datafiles/icons/brush.uv_sculpt.grab.dat",
      "start": 24923884,
      "end": 24927060
    }, {
      "filename": "/5.3/datafiles/icons/brush.uv_sculpt.pinch.dat",
      "start": 24927060,
      "end": 24931028
    }, {
      "filename": "/5.3/datafiles/icons/brush.uv_sculpt.relax.dat",
      "start": 24931028,
      "end": 24938236
    }, {
      "filename": "/5.3/datafiles/icons/none.dat",
      "start": 24938236,
      "end": 24941250
    }, {
      "filename": "/5.3/datafiles/icons/ops.armature.bone.roll.dat",
      "start": 24941250,
      "end": 24942896
    }, {
      "filename": "/5.3/datafiles/icons/ops.armature.extrude.cursor.dat",
      "start": 24942896,
      "end": 24944398
    }, {
      "filename": "/5.3/datafiles/icons/ops.armature.extrude.dat",
      "start": 24944398,
      "end": 24945648
    }, {
      "filename": "/5.3/datafiles/icons/ops.armature.extrude_cursor.dat",
      "start": 24945648,
      "end": 24947222
    }, {
      "filename": "/5.3/datafiles/icons/ops.armature.extrude_move.dat",
      "start": 24947222,
      "end": 24948598
    }, {
      "filename": "/5.3/datafiles/icons/ops.curve.draw.dat",
      "start": 24948598,
      "end": 24951e3
    }, {
      "filename": "/5.3/datafiles/icons/ops.curve.dupli_extrude_cursor.dat",
      "start": 24951e3,
      "end": 24955202
    }, {
      "filename": "/5.3/datafiles/icons/ops.curve.extrude_cursor.dat",
      "start": 24955202,
      "end": 24957046
    }, {
      "filename": "/5.3/datafiles/icons/ops.curve.extrude_move.dat",
      "start": 24957046,
      "end": 24958800
    }, {
      "filename": "/5.3/datafiles/icons/ops.curve.pen.dat",
      "start": 24958800,
      "end": 24962174
    }, {
      "filename": "/5.3/datafiles/icons/ops.curve.radius.dat",
      "start": 24962174,
      "end": 24963640
    }, {
      "filename": "/5.3/datafiles/icons/ops.curve.vertex_random.dat",
      "start": 24963640,
      "end": 24965052
    }, {
      "filename": "/5.3/datafiles/icons/ops.curves.sculpt_add.dat",
      "start": 24965052,
      "end": 24967184
    }, {
      "filename": "/5.3/datafiles/icons/ops.curves.sculpt_delete.dat",
      "start": 24967184,
      "end": 24969244
    }, {
      "filename": "/5.3/datafiles/icons/ops.curves.sculpt_density.dat",
      "start": 24969244,
      "end": 24972276
    }, {
      "filename": "/5.3/datafiles/icons/ops.generic.cursor.dat",
      "start": 24972276,
      "end": 24974444
    }, {
      "filename": "/5.3/datafiles/icons/ops.generic.select.dat",
      "start": 24974444,
      "end": 24974740
    }, {
      "filename": "/5.3/datafiles/icons/ops.generic.select_box.dat",
      "start": 24974740,
      "end": 24977052
    }, {
      "filename": "/5.3/datafiles/icons/ops.generic.select_circle.dat",
      "start": 24977052,
      "end": 24979616
    }, {
      "filename": "/5.3/datafiles/icons/ops.generic.select_lasso.dat",
      "start": 24979616,
      "end": 24982018
    }, {
      "filename": "/5.3/datafiles/icons/ops.generic.select_paint.dat",
      "start": 24982018,
      "end": 24983808
    }, {
      "filename": "/5.3/datafiles/icons/ops.gpencil.draw.dat",
      "start": 24983808,
      "end": 24985346
    }, {
      "filename": "/5.3/datafiles/icons/ops.gpencil.draw.eraser.dat",
      "start": 24985346,
      "end": 24986758
    }, {
      "filename": "/5.3/datafiles/icons/ops.gpencil.draw.line.dat",
      "start": 24986758,
      "end": 24987486
    }, {
      "filename": "/5.3/datafiles/icons/ops.gpencil.draw.poly.dat",
      "start": 24987486,
      "end": 24988340
    }, {
      "filename": "/5.3/datafiles/icons/ops.gpencil.edit_bend.dat",
      "start": 24988340,
      "end": 24990004
    }, {
      "filename": "/5.3/datafiles/icons/ops.gpencil.edit_mirror.dat",
      "start": 24990004,
      "end": 24993234
    }, {
      "filename": "/5.3/datafiles/icons/ops.gpencil.edit_shear.dat",
      "start": 24993234,
      "end": 24994520
    }, {
      "filename": "/5.3/datafiles/icons/ops.gpencil.edit_to_sphere.dat",
      "start": 24994520,
      "end": 24994672
    }, {
      "filename": "/5.3/datafiles/icons/ops.gpencil.extrude_move.dat",
      "start": 24994672,
      "end": 25000098
    }, {
      "filename": "/5.3/datafiles/icons/ops.gpencil.primitive_arc.dat",
      "start": 25000098,
      "end": 25001240
    }, {
      "filename": "/5.3/datafiles/icons/ops.gpencil.primitive_box.dat",
      "start": 25001240,
      "end": 25001572
    }, {
      "filename": "/5.3/datafiles/icons/ops.gpencil.primitive_circle.dat",
      "start": 25001572,
      "end": 25002912
    }, {
      "filename": "/5.3/datafiles/icons/ops.gpencil.primitive_curve.dat",
      "start": 25002912,
      "end": 25004108
    }, {
      "filename": "/5.3/datafiles/icons/ops.gpencil.primitive_line.dat",
      "start": 25004108,
      "end": 25004548
    }, {
      "filename": "/5.3/datafiles/icons/ops.gpencil.primitive_polyline.dat",
      "start": 25004548,
      "end": 25005222
    }, {
      "filename": "/5.3/datafiles/icons/ops.gpencil.radius.dat",
      "start": 25005222,
      "end": 25006688
    }, {
      "filename": "/5.3/datafiles/icons/ops.gpencil.sculpt_average.dat",
      "start": 25006688,
      "end": 25009972
    }, {
      "filename": "/5.3/datafiles/icons/ops.gpencil.sculpt_blur.dat",
      "start": 25009972,
      "end": 25011276
    }, {
      "filename": "/5.3/datafiles/icons/ops.gpencil.sculpt_clone.dat",
      "start": 25011276,
      "end": 25014452
    }, {
      "filename": "/5.3/datafiles/icons/ops.gpencil.sculpt_smear.dat",
      "start": 25014452,
      "end": 25016152
    }, {
      "filename": "/5.3/datafiles/icons/ops.gpencil.stroke_trim.dat",
      "start": 25016152,
      "end": 25018068
    }, {
      "filename": "/5.3/datafiles/icons/ops.gpencil.transform_fill.dat",
      "start": 25018068,
      "end": 25020200
    }, {
      "filename": "/5.3/datafiles/icons/ops.mesh.bevel.dat",
      "start": 25020200,
      "end": 25020622
    }, {
      "filename": "/5.3/datafiles/icons/ops.mesh.bisect.dat",
      "start": 25020622,
      "end": 25021116
    }, {
      "filename": "/5.3/datafiles/icons/ops.mesh.dupli_extrude_cursor.dat",
      "start": 25021116,
      "end": 25021862
    }, {
      "filename": "/5.3/datafiles/icons/ops.mesh.extrude_faces_move.dat",
      "start": 25021862,
      "end": 25022158
    }, {
      "filename": "/5.3/datafiles/icons/ops.mesh.extrude_manifold.dat",
      "start": 25022158,
      "end": 25022652
    }, {
      "filename": "/5.3/datafiles/icons/ops.mesh.extrude_region_move.dat",
      "start": 25022652,
      "end": 25023002
    }, {
      "filename": "/5.3/datafiles/icons/ops.mesh.extrude_region_shrink_fatten.dat",
      "start": 25023002,
      "end": 25023226
    }, {
      "filename": "/5.3/datafiles/icons/ops.mesh.inset.dat",
      "start": 25023226,
      "end": 25023810
    }, {
      "filename": "/5.3/datafiles/icons/ops.mesh.knife_tool.dat",
      "start": 25023810,
      "end": 25025330
    }, {
      "filename": "/5.3/datafiles/icons/ops.mesh.loopcut_slide.dat",
      "start": 25025330,
      "end": 25026040
    }, {
      "filename": "/5.3/datafiles/icons/ops.mesh.offset_edge_loops_slide.dat",
      "start": 25026040,
      "end": 25027002
    }, {
      "filename": "/5.3/datafiles/icons/ops.mesh.polybuild_hover.dat",
      "start": 25027002,
      "end": 25031600
    }, {
      "filename": "/5.3/datafiles/icons/ops.mesh.primitive_cone_add_gizmo.dat",
      "start": 25031600,
      "end": 25033732
    }, {
      "filename": "/5.3/datafiles/icons/ops.mesh.primitive_cube_add_gizmo.dat",
      "start": 25033732,
      "end": 25034712
    }, {
      "filename": "/5.3/datafiles/icons/ops.mesh.primitive_cylinder_add_gizmo.dat",
      "start": 25034712,
      "end": 25040084
    }, {
      "filename": "/5.3/datafiles/icons/ops.mesh.primitive_grid_add_gizmo.dat",
      "start": 25040084,
      "end": 25040650
    }, {
      "filename": "/5.3/datafiles/icons/ops.mesh.primitive_sphere_add_gizmo.dat",
      "start": 25040650,
      "end": 25046886
    }, {
      "filename": "/5.3/datafiles/icons/ops.mesh.primitive_torus_add_gizmo.dat",
      "start": 25046886,
      "end": 25055138
    }, {
      "filename": "/5.3/datafiles/icons/ops.mesh.rip.dat",
      "start": 25055138,
      "end": 25056082
    }, {
      "filename": "/5.3/datafiles/icons/ops.mesh.rip_edge.dat",
      "start": 25056082,
      "end": 25056972
    }, {
      "filename": "/5.3/datafiles/icons/ops.mesh.spin.dat",
      "start": 25056972,
      "end": 25058510
    }, {
      "filename": "/5.3/datafiles/icons/ops.mesh.vertices_smooth.dat",
      "start": 25058510,
      "end": 25058806
    }, {
      "filename": "/5.3/datafiles/icons/ops.node.add_reroute.dat",
      "start": 25058806,
      "end": 25061856
    }, {
      "filename": "/5.3/datafiles/icons/ops.node.links_cut.dat",
      "start": 25061856,
      "end": 25063484
    }, {
      "filename": "/5.3/datafiles/icons/ops.node.links_mute.dat",
      "start": 25063484,
      "end": 25065562
    }, {
      "filename": "/5.3/datafiles/icons/ops.paint.eyedropper_add.dat",
      "start": 25065562,
      "end": 25066524
    }, {
      "filename": "/5.3/datafiles/icons/ops.paint.vertex_color_fill.dat",
      "start": 25066524,
      "end": 25068368
    }, {
      "filename": "/5.3/datafiles/icons/ops.paint.weight_fill.dat",
      "start": 25068368,
      "end": 25070644
    }, {
      "filename": "/5.3/datafiles/icons/ops.paint.weight_gradient.dat",
      "start": 25070644,
      "end": 25071876
    }, {
      "filename": "/5.3/datafiles/icons/ops.paint.weight_sample.dat",
      "start": 25071876,
      "end": 25073378
    }, {
      "filename": "/5.3/datafiles/icons/ops.paint.weight_sample_group.dat",
      "start": 25073378,
      "end": 25074916
    }, {
      "filename": "/5.3/datafiles/icons/ops.pose.breakdowner.dat",
      "start": 25074916,
      "end": 25076598
    }, {
      "filename": "/5.3/datafiles/icons/ops.pose.push.dat",
      "start": 25076598,
      "end": 25078982
    }, {
      "filename": "/5.3/datafiles/icons/ops.pose.relax.dat",
      "start": 25078982,
      "end": 25080376
    }, {
      "filename": "/5.3/datafiles/icons/ops.sculpt.border_face_set.dat",
      "start": 25080376,
      "end": 25081518
    }, {
      "filename": "/5.3/datafiles/icons/ops.sculpt.border_hide.dat",
      "start": 25081518,
      "end": 25082138
    }, {
      "filename": "/5.3/datafiles/icons/ops.sculpt.border_mask.dat",
      "start": 25082138,
      "end": 25083082
    }, {
      "filename": "/5.3/datafiles/icons/ops.sculpt.box_trim.dat",
      "start": 25083082,
      "end": 25084818
    }, {
      "filename": "/5.3/datafiles/icons/ops.sculpt.cloth_filter.dat",
      "start": 25084818,
      "end": 25090388
    }, {
      "filename": "/5.3/datafiles/icons/ops.sculpt.color_filter.dat",
      "start": 25090388,
      "end": 25092088
    }, {
      "filename": "/5.3/datafiles/icons/ops.sculpt.face_set_edit.dat",
      "start": 25092088,
      "end": 25093788
    }, {
      "filename": "/5.3/datafiles/icons/ops.sculpt.lasso_face_set.dat",
      "start": 25093788,
      "end": 25097072
    }, {
      "filename": "/5.3/datafiles/icons/ops.sculpt.lasso_hide.dat",
      "start": 25097072,
      "end": 25099312
    }, {
      "filename": "/5.3/datafiles/icons/ops.sculpt.lasso_mask.dat",
      "start": 25099312,
      "end": 25102290
    }, {
      "filename": "/5.3/datafiles/icons/ops.sculpt.lasso_trim.dat",
      "start": 25102290,
      "end": 25105106
    }, {
      "filename": "/5.3/datafiles/icons/ops.sculpt.line_face_set.dat",
      "start": 25105106,
      "end": 25106896
    }, {
      "filename": "/5.3/datafiles/icons/ops.sculpt.line_hide.dat",
      "start": 25106896,
      "end": 25107930
    }, {
      "filename": "/5.3/datafiles/icons/ops.sculpt.line_mask.dat",
      "start": 25107930,
      "end": 25109342
    }, {
      "filename": "/5.3/datafiles/icons/ops.sculpt.line_project.dat",
      "start": 25109342,
      "end": 25110358
    }, {
      "filename": "/5.3/datafiles/icons/ops.sculpt.line_trim.dat",
      "start": 25110358,
      "end": 25112184
    }, {
      "filename": "/5.3/datafiles/icons/ops.sculpt.mask_by_color.dat",
      "start": 25112184,
      "end": 25115900
    }, {
      "filename": "/5.3/datafiles/icons/ops.sculpt.mesh_filter.dat",
      "start": 25115900,
      "end": 25117960
    }, {
      "filename": "/5.3/datafiles/icons/ops.sculpt.polyline_face_set.dat",
      "start": 25117960,
      "end": 25122396
    }, {
      "filename": "/5.3/datafiles/icons/ops.sculpt.polyline_hide.dat",
      "start": 25122396,
      "end": 25126022
    }, {
      "filename": "/5.3/datafiles/icons/ops.sculpt.polyline_mask.dat",
      "start": 25126022,
      "end": 25130422
    }, {
      "filename": "/5.3/datafiles/icons/ops.sculpt.polyline_trim.dat",
      "start": 25130422,
      "end": 25134138
    }, {
      "filename": "/5.3/datafiles/icons/ops.sequencer.blade.dat",
      "start": 25134138,
      "end": 25135514
    }, {
      "filename": "/5.3/datafiles/icons/ops.sequencer.retime.dat",
      "start": 25135514,
      "end": 25139464
    }, {
      "filename": "/5.3/datafiles/icons/ops.sequencer.slip.dat",
      "start": 25139464,
      "end": 25142514
    }, {
      "filename": "/5.3/datafiles/icons/ops.transform.bone_envelope.dat",
      "start": 25142514,
      "end": 25144250
    }, {
      "filename": "/5.3/datafiles/icons/ops.transform.bone_size.dat",
      "start": 25144250,
      "end": 25145302
    }, {
      "filename": "/5.3/datafiles/icons/ops.transform.edge_slide.dat",
      "start": 25145302,
      "end": 25146102
    }, {
      "filename": "/5.3/datafiles/icons/ops.transform.push_pull.dat",
      "start": 25146102,
      "end": 25146830
    }, {
      "filename": "/5.3/datafiles/icons/ops.transform.resize.cage.dat",
      "start": 25146830,
      "end": 25149286
    }, {
      "filename": "/5.3/datafiles/icons/ops.transform.resize.dat",
      "start": 25149286,
      "end": 25149564
    }, {
      "filename": "/5.3/datafiles/icons/ops.transform.rotate.dat",
      "start": 25149564,
      "end": 25151228
    }, {
      "filename": "/5.3/datafiles/icons/ops.transform.shear.dat",
      "start": 25151228,
      "end": 25151434
    }, {
      "filename": "/5.3/datafiles/icons/ops.transform.shrink_fatten.dat",
      "start": 25151434,
      "end": 25152576
    }, {
      "filename": "/5.3/datafiles/icons/ops.transform.tilt.dat",
      "start": 25152576,
      "end": 25158398
    }, {
      "filename": "/5.3/datafiles/icons/ops.transform.tosphere.dat",
      "start": 25158398,
      "end": 25159630
    }, {
      "filename": "/5.3/datafiles/icons/ops.transform.transform.dat",
      "start": 25159630,
      "end": 25161330
    }, {
      "filename": "/5.3/datafiles/icons/ops.transform.translate.dat",
      "start": 25161330,
      "end": 25161554
    }, {
      "filename": "/5.3/datafiles/icons/ops.transform.vert_slide.dat",
      "start": 25161554,
      "end": 25162660
    }, {
      "filename": "/5.3/datafiles/icons/ops.transform.vertex_random.dat",
      "start": 25162660,
      "end": 25162956
    }, {
      "filename": "/5.3/datafiles/icons/ops.view3d.ruler.dat",
      "start": 25162956,
      "end": 25164728
    }, {
      "filename": "/5.3/datafiles/icons_blend/toolbar.blend",
      "start": 25164728,
      "end": 28035523
    }, {
      "filename": "/5.3/datafiles/icons_svg/action.svg",
      "start": 28035523,
      "end": 28036950
    }, {
      "filename": "/5.3/datafiles/icons_svg/action_slot.svg",
      "start": 28036950,
      "end": 28038740
    }, {
      "filename": "/5.3/datafiles/icons_svg/action_tweak.svg",
      "start": 28038740,
      "end": 28040193
    }, {
      "filename": "/5.3/datafiles/icons_svg/add.svg",
      "start": 28040193,
      "end": 28040968
    }, {
      "filename": "/5.3/datafiles/icons_svg/aliased.svg",
      "start": 28040968,
      "end": 28041566
    }, {
      "filename": "/5.3/datafiles/icons_svg/align_bottom.svg",
      "start": 28041566,
      "end": 28042405
    }, {
      "filename": "/5.3/datafiles/icons_svg/align_center.svg",
      "start": 28042405,
      "end": 28043213
    }, {
      "filename": "/5.3/datafiles/icons_svg/align_flush.svg",
      "start": 28043213,
      "end": 28044961
    }, {
      "filename": "/5.3/datafiles/icons_svg/align_justify.svg",
      "start": 28044961,
      "end": 28045769
    }, {
      "filename": "/5.3/datafiles/icons_svg/align_left.svg",
      "start": 28045769,
      "end": 28046573
    }, {
      "filename": "/5.3/datafiles/icons_svg/align_middle.svg",
      "start": 28046573,
      "end": 28047412
    }, {
      "filename": "/5.3/datafiles/icons_svg/align_right.svg",
      "start": 28047412,
      "end": 28048220
    }, {
      "filename": "/5.3/datafiles/icons_svg/align_top.svg",
      "start": 28048220,
      "end": 28049059
    }, {
      "filename": "/5.3/datafiles/icons_svg/anchor_bottom.svg",
      "start": 28049059,
      "end": 28050171
    }, {
      "filename": "/5.3/datafiles/icons_svg/anchor_center.svg",
      "start": 28050171,
      "end": 28051428
    }, {
      "filename": "/5.3/datafiles/icons_svg/anchor_left.svg",
      "start": 28051428,
      "end": 28052533
    }, {
      "filename": "/5.3/datafiles/icons_svg/anchor_right.svg",
      "start": 28052533,
      "end": 28053642
    }, {
      "filename": "/5.3/datafiles/icons_svg/anchor_top.svg",
      "start": 28053642,
      "end": 28054751
    }, {
      "filename": "/5.3/datafiles/icons_svg/anim.svg",
      "start": 28054751,
      "end": 28055958
    }, {
      "filename": "/5.3/datafiles/icons_svg/anim_data.svg",
      "start": 28055958,
      "end": 28057165
    }, {
      "filename": "/5.3/datafiles/icons_svg/antialiased.svg",
      "start": 28057165,
      "end": 28057906
    }, {
      "filename": "/5.3/datafiles/icons_svg/append_blend.svg",
      "start": 28057906,
      "end": 28059454
    }, {
      "filename": "/5.3/datafiles/icons_svg/area_dock.svg",
      "start": 28059454,
      "end": 28060419
    }, {
      "filename": "/5.3/datafiles/icons_svg/area_join.svg",
      "start": 28060419,
      "end": 28061631
    }, {
      "filename": "/5.3/datafiles/icons_svg/area_join_down.svg",
      "start": 28061631,
      "end": 28062946
    }, {
      "filename": "/5.3/datafiles/icons_svg/area_join_left.svg",
      "start": 28062946,
      "end": 28064265
    }, {
      "filename": "/5.3/datafiles/icons_svg/area_join_up.svg",
      "start": 28064265,
      "end": 28065580
    }, {
      "filename": "/5.3/datafiles/icons_svg/area_swap.svg",
      "start": 28065580,
      "end": 28066968
    }, {
      "filename": "/5.3/datafiles/icons_svg/armature_data.svg",
      "start": 28066968,
      "end": 28068395
    }, {
      "filename": "/5.3/datafiles/icons_svg/arrow_leftright.svg",
      "start": 28068395,
      "end": 28069465
    }, {
      "filename": "/5.3/datafiles/icons_svg/asset_manager.svg",
      "start": 28069465,
      "end": 28070510
    }, {
      "filename": "/5.3/datafiles/icons_svg/auto.svg",
      "start": 28070510,
      "end": 28072117
    }, {
      "filename": "/5.3/datafiles/icons_svg/automerge_off.svg",
      "start": 28072117,
      "end": 28073874
    }, {
      "filename": "/5.3/datafiles/icons_svg/automerge_on.svg",
      "start": 28073874,
      "end": 28075332
    }, {
      "filename": "/5.3/datafiles/icons_svg/axis_front.svg",
      "start": 28075332,
      "end": 28076412
    }, {
      "filename": "/5.3/datafiles/icons_svg/axis_side.svg",
      "start": 28076412,
      "end": 28077492
    }, {
      "filename": "/5.3/datafiles/icons_svg/axis_top.svg",
      "start": 28077492,
      "end": 28078517
    }, {
      "filename": "/5.3/datafiles/icons_svg/back.svg",
      "start": 28078517,
      "end": 28079319
    }, {
      "filename": "/5.3/datafiles/icons_svg/blank1.svg",
      "start": 28079319,
      "end": 28079732
    }, {
      "filename": "/5.3/datafiles/icons_svg/blender.svg",
      "start": 28079732,
      "end": 28081892
    }, {
      "filename": "/5.3/datafiles/icons_svg/blender_logo_large.svg",
      "start": 28081892,
      "end": 28088991
    }, {
      "filename": "/5.3/datafiles/icons_svg/boids.svg",
      "start": 28088991,
      "end": 28091352
    }, {
      "filename": "/5.3/datafiles/icons_svg/bold.svg",
      "start": 28091352,
      "end": 28092296
    }, {
      "filename": "/5.3/datafiles/icons_svg/bone_data.svg",
      "start": 28092296,
      "end": 28093225
    }, {
      "filename": "/5.3/datafiles/icons_svg/bookmarks.svg",
      "start": 28093225,
      "end": 28093922
    }, {
      "filename": "/5.3/datafiles/icons_svg/bordermove.svg",
      "start": 28093922,
      "end": 28095242
    }, {
      "filename": "/5.3/datafiles/icons_svg/brush_data.svg",
      "start": 28095242,
      "end": 28096871
    }, {
      "filename": "/5.3/datafiles/icons_svg/brushes_all.svg",
      "start": 28096871,
      "end": 28098518
    }, {
      "filename": "/5.3/datafiles/icons_svg/camera_data.svg",
      "start": 28098518,
      "end": 28100458
    }, {
      "filename": "/5.3/datafiles/icons_svg/camera_stereo.svg",
      "start": 28100458,
      "end": 28102244
    }, {
      "filename": "/5.3/datafiles/icons_svg/cancel.svg",
      "start": 28102244,
      "end": 28103452
    }, {
      "filename": "/5.3/datafiles/icons_svg/cancel_large.svg",
      "start": 28103452,
      "end": 28105732
    }, {
      "filename": "/5.3/datafiles/icons_svg/center_only.svg",
      "start": 28105732,
      "end": 28107383
    }, {
      "filename": "/5.3/datafiles/icons_svg/char_notdef.svg",
      "start": 28107383,
      "end": 28108224
    }, {
      "filename": "/5.3/datafiles/icons_svg/char_replacement.svg",
      "start": 28108224,
      "end": 28109271
    }, {
      "filename": "/5.3/datafiles/icons_svg/checkbox_dehlt.svg",
      "start": 28109271,
      "end": 28110124
    }, {
      "filename": "/5.3/datafiles/icons_svg/checkbox_hlt.svg",
      "start": 28110124,
      "end": 28111007
    }, {
      "filename": "/5.3/datafiles/icons_svg/checkmark.svg",
      "start": 28111007,
      "end": 28111703
    }, {
      "filename": "/5.3/datafiles/icons_svg/clipuv_dehlt.svg",
      "start": 28111703,
      "end": 28112449
    }, {
      "filename": "/5.3/datafiles/icons_svg/clipuv_hlt.svg",
      "start": 28112449,
      "end": 28113279
    }, {
      "filename": "/5.3/datafiles/icons_svg/collapsemenu.svg",
      "start": 28113279,
      "end": 28114246
    }, {
      "filename": "/5.3/datafiles/icons_svg/collection_color_01.svg",
      "start": 28114246,
      "end": 28115717
    }, {
      "filename": "/5.3/datafiles/icons_svg/collection_color_02.svg",
      "start": 28115717,
      "end": 28117188
    }, {
      "filename": "/5.3/datafiles/icons_svg/collection_color_03.svg",
      "start": 28117188,
      "end": 28118659
    }, {
      "filename": "/5.3/datafiles/icons_svg/collection_color_04.svg",
      "start": 28118659,
      "end": 28120130
    }, {
      "filename": "/5.3/datafiles/icons_svg/collection_color_05.svg",
      "start": 28120130,
      "end": 28121601
    }, {
      "filename": "/5.3/datafiles/icons_svg/collection_color_06.svg",
      "start": 28121601,
      "end": 28123072
    }, {
      "filename": "/5.3/datafiles/icons_svg/collection_color_07.svg",
      "start": 28123072,
      "end": 28124543
    }, {
      "filename": "/5.3/datafiles/icons_svg/collection_color_08.svg",
      "start": 28124543,
      "end": 28126014
    }, {
      "filename": "/5.3/datafiles/icons_svg/collection_new.svg",
      "start": 28126014,
      "end": 28126979
    }, {
      "filename": "/5.3/datafiles/icons_svg/color.svg",
      "start": 28126979,
      "end": 28128292
    }, {
      "filename": "/5.3/datafiles/icons_svg/color_blue.svg",
      "start": 28128292,
      "end": 28129502
    }, {
      "filename": "/5.3/datafiles/icons_svg/color_green.svg",
      "start": 28129502,
      "end": 28130530
    }, {
      "filename": "/5.3/datafiles/icons_svg/color_red.svg",
      "start": 28130530,
      "end": 28131396
    }, {
      "filename": "/5.3/datafiles/icons_svg/community.svg",
      "start": 28131396,
      "end": 28133124
    }, {
      "filename": "/5.3/datafiles/icons_svg/con_action.svg",
      "start": 28133124,
      "end": 28134260
    }, {
      "filename": "/5.3/datafiles/icons_svg/con_armature.svg",
      "start": 28134260,
      "end": 28135658
    }, {
      "filename": "/5.3/datafiles/icons_svg/con_camerasolver.svg",
      "start": 28135658,
      "end": 28136614
    }, {
      "filename": "/5.3/datafiles/icons_svg/con_childof.svg",
      "start": 28136614,
      "end": 28137798
    }, {
      "filename": "/5.3/datafiles/icons_svg/con_clampto.svg",
      "start": 28137798,
      "end": 28139305
    }, {
      "filename": "/5.3/datafiles/icons_svg/con_distlimit.svg",
      "start": 28139305,
      "end": 28140219
    }, {
      "filename": "/5.3/datafiles/icons_svg/con_floor.svg",
      "start": 28140219,
      "end": 28141668
    }, {
      "filename": "/5.3/datafiles/icons_svg/con_followpath.svg",
      "start": 28141668,
      "end": 28143039
    }, {
      "filename": "/5.3/datafiles/icons_svg/con_followtrack.svg",
      "start": 28143039,
      "end": 28144265
    }, {
      "filename": "/5.3/datafiles/icons_svg/con_geometryattribute.svg",
      "start": 28144265,
      "end": 28147088
    }, {
      "filename": "/5.3/datafiles/icons_svg/con_kinematic.svg",
      "start": 28147088,
      "end": 28148383
    }, {
      "filename": "/5.3/datafiles/icons_svg/con_locktrack.svg",
      "start": 28148383,
      "end": 28149639
    }, {
      "filename": "/5.3/datafiles/icons_svg/con_loclike.svg",
      "start": 28149639,
      "end": 28151279
    }, {
      "filename": "/5.3/datafiles/icons_svg/con_loclimit.svg",
      "start": 28151279,
      "end": 28152428
    }, {
      "filename": "/5.3/datafiles/icons_svg/con_objectsolver.svg",
      "start": 28152428,
      "end": 28153431
    }, {
      "filename": "/5.3/datafiles/icons_svg/con_pivot.svg",
      "start": 28153431,
      "end": 28154379
    }, {
      "filename": "/5.3/datafiles/icons_svg/con_rotlike.svg",
      "start": 28154379,
      "end": 28156046
    }, {
      "filename": "/5.3/datafiles/icons_svg/con_rotlimit.svg",
      "start": 28156046,
      "end": 28157096
    }, {
      "filename": "/5.3/datafiles/icons_svg/con_samevol.svg",
      "start": 28157096,
      "end": 28157922
    }, {
      "filename": "/5.3/datafiles/icons_svg/con_shrinkwrap.svg",
      "start": 28157922,
      "end": 28158839
    }, {
      "filename": "/5.3/datafiles/icons_svg/con_sizelike.svg",
      "start": 28158839,
      "end": 28159863
    }, {
      "filename": "/5.3/datafiles/icons_svg/con_sizelimit.svg",
      "start": 28159863,
      "end": 28160830
    }, {
      "filename": "/5.3/datafiles/icons_svg/con_splineik.svg",
      "start": 28160830,
      "end": 28162392
    }, {
      "filename": "/5.3/datafiles/icons_svg/con_stretchto.svg",
      "start": 28162392,
      "end": 28163740
    }, {
      "filename": "/5.3/datafiles/icons_svg/con_trackto.svg",
      "start": 28163740,
      "end": 28165089
    }, {
      "filename": "/5.3/datafiles/icons_svg/con_transform.svg",
      "start": 28165089,
      "end": 28166642
    }, {
      "filename": "/5.3/datafiles/icons_svg/con_transform_cache.svg",
      "start": 28166642,
      "end": 28169205
    }, {
      "filename": "/5.3/datafiles/icons_svg/con_translike.svg",
      "start": 28169205,
      "end": 28171351
    }, {
      "filename": "/5.3/datafiles/icons_svg/cone.svg",
      "start": 28171351,
      "end": 28173140
    }, {
      "filename": "/5.3/datafiles/icons_svg/console.svg",
      "start": 28173140,
      "end": 28173864
    }, {
      "filename": "/5.3/datafiles/icons_svg/constraint.svg",
      "start": 28173864,
      "end": 28175450
    }, {
      "filename": "/5.3/datafiles/icons_svg/constraint_bone.svg",
      "start": 28175450,
      "end": 28177650
    }, {
      "filename": "/5.3/datafiles/icons_svg/copy_id.svg",
      "start": 28177650,
      "end": 28178881
    }, {
      "filename": "/5.3/datafiles/icons_svg/copydown.svg",
      "start": 28178881,
      "end": 28180107
    }, {
      "filename": "/5.3/datafiles/icons_svg/cube.svg",
      "start": 28180107,
      "end": 28181228
    }, {
      "filename": "/5.3/datafiles/icons_svg/current_file.svg",
      "start": 28181228,
      "end": 28182656
    }, {
      "filename": "/5.3/datafiles/icons_svg/cursor.svg",
      "start": 28182656,
      "end": 28183919
    }, {
      "filename": "/5.3/datafiles/icons_svg/curve_bezcircle.svg",
      "start": 28183919,
      "end": 28185184
    }, {
      "filename": "/5.3/datafiles/icons_svg/curve_bezcurve.svg",
      "start": 28185184,
      "end": 28186528
    }, {
      "filename": "/5.3/datafiles/icons_svg/curve_data.svg",
      "start": 28186528,
      "end": 28187671
    }, {
      "filename": "/5.3/datafiles/icons_svg/curve_ncircle.svg",
      "start": 28187671,
      "end": 28188942
    }, {
      "filename": "/5.3/datafiles/icons_svg/curve_ncurve.svg",
      "start": 28188942,
      "end": 28190370
    }, {
      "filename": "/5.3/datafiles/icons_svg/curve_path.svg",
      "start": 28190370,
      "end": 28191341
    }, {
      "filename": "/5.3/datafiles/icons_svg/curves.svg",
      "start": 28191341,
      "end": 28192545
    }, {
      "filename": "/5.3/datafiles/icons_svg/curves_data.svg",
      "start": 28192545,
      "end": 28193693
    }, {
      "filename": "/5.3/datafiles/icons_svg/decorate.svg",
      "start": 28193693,
      "end": 28194509
    }, {
      "filename": "/5.3/datafiles/icons_svg/decorate_animate.svg",
      "start": 28194509,
      "end": 28195296
    }, {
      "filename": "/5.3/datafiles/icons_svg/decorate_driver.svg",
      "start": 28195296,
      "end": 28196492
    }, {
      "filename": "/5.3/datafiles/icons_svg/decorate_keyframe.svg",
      "start": 28196492,
      "end": 28197237
    }, {
      "filename": "/5.3/datafiles/icons_svg/decorate_library_override.svg",
      "start": 28197237,
      "end": 28199484
    }, {
      "filename": "/5.3/datafiles/icons_svg/decorate_linked.svg",
      "start": 28199484,
      "end": 28202252
    }, {
      "filename": "/5.3/datafiles/icons_svg/decorate_locked.svg",
      "start": 28202252,
      "end": 28203156
    }, {
      "filename": "/5.3/datafiles/icons_svg/decorate_override.svg",
      "start": 28203156,
      "end": 28204200
    }, {
      "filename": "/5.3/datafiles/icons_svg/decorate_unlocked.svg",
      "start": 28204200,
      "end": 28205540
    }, {
      "filename": "/5.3/datafiles/icons_svg/desktop.svg",
      "start": 28205540,
      "end": 28208267
    }, {
      "filename": "/5.3/datafiles/icons_svg/disc.svg",
      "start": 28208267,
      "end": 28209867
    }, {
      "filename": "/5.3/datafiles/icons_svg/disc_large.svg",
      "start": 28209867,
      "end": 28214744
    }, {
      "filename": "/5.3/datafiles/icons_svg/disclosure_tri_down.svg",
      "start": 28214744,
      "end": 28215630
    }, {
      "filename": "/5.3/datafiles/icons_svg/disclosure_tri_right.svg",
      "start": 28215630,
      "end": 28216568
    }, {
      "filename": "/5.3/datafiles/icons_svg/disk_drive.svg",
      "start": 28216568,
      "end": 28217592
    }, {
      "filename": "/5.3/datafiles/icons_svg/disk_drive_large.svg",
      "start": 28217592,
      "end": 28220453
    }, {
      "filename": "/5.3/datafiles/icons_svg/documents.svg",
      "start": 28220453,
      "end": 28221618
    }, {
      "filename": "/5.3/datafiles/icons_svg/dot.svg",
      "start": 28221618,
      "end": 28222416
    }, {
      "filename": "/5.3/datafiles/icons_svg/downarrow_hlt.svg",
      "start": 28222416,
      "end": 28223107
    }, {
      "filename": "/5.3/datafiles/icons_svg/download.svg",
      "start": 28223107,
      "end": 28225663
    }, {
      "filename": "/5.3/datafiles/icons_svg/download_done.svg",
      "start": 28225663,
      "end": 28227262
    }, {
      "filename": "/5.3/datafiles/icons_svg/driver.svg",
      "start": 28227262,
      "end": 28228347
    }, {
      "filename": "/5.3/datafiles/icons_svg/driver_distance.svg",
      "start": 28228347,
      "end": 28229603
    }, {
      "filename": "/5.3/datafiles/icons_svg/driver_rotational_difference.svg",
      "start": 28229603,
      "end": 28230897
    }, {
      "filename": "/5.3/datafiles/icons_svg/driver_transform.svg",
      "start": 28230897,
      "end": 28232310
    }, {
      "filename": "/5.3/datafiles/icons_svg/duplicate.svg",
      "start": 28232310,
      "end": 28233260
    }, {
      "filename": "/5.3/datafiles/icons_svg/edge_bevel.svg",
      "start": 28233260,
      "end": 28234453
    }, {
      "filename": "/5.3/datafiles/icons_svg/edge_crease.svg",
      "start": 28234453,
      "end": 28235647
    }, {
      "filename": "/5.3/datafiles/icons_svg/edge_seam.svg",
      "start": 28235647,
      "end": 28236839
    }, {
      "filename": "/5.3/datafiles/icons_svg/edge_sharp.svg",
      "start": 28236839,
      "end": 28238050
    }, {
      "filename": "/5.3/datafiles/icons_svg/edgesel.svg",
      "start": 28238050,
      "end": 28239172
    }, {
      "filename": "/5.3/datafiles/icons_svg/editmode_hlt.svg",
      "start": 28239172,
      "end": 28240513
    }, {
      "filename": "/5.3/datafiles/icons_svg/empty_arrows.svg",
      "start": 28240513,
      "end": 28241552
    }, {
      "filename": "/5.3/datafiles/icons_svg/empty_axis.svg",
      "start": 28241552,
      "end": 28242662
    }, {
      "filename": "/5.3/datafiles/icons_svg/empty_data.svg",
      "start": 28242662,
      "end": 28243367
    }, {
      "filename": "/5.3/datafiles/icons_svg/empty_single_arrow.svg",
      "start": 28243367,
      "end": 28244170
    }, {
      "filename": "/5.3/datafiles/icons_svg/error.svg",
      "start": 28244170,
      "end": 28245203
    }, {
      "filename": "/5.3/datafiles/icons_svg/experimental.svg",
      "start": 28245203,
      "end": 28246708
    }, {
      "filename": "/5.3/datafiles/icons_svg/export.svg",
      "start": 28246708,
      "end": 28247795
    }, {
      "filename": "/5.3/datafiles/icons_svg/external_drive.svg",
      "start": 28247795,
      "end": 28249411
    }, {
      "filename": "/5.3/datafiles/icons_svg/external_drive_large.svg",
      "start": 28249411,
      "end": 28253171
    }, {
      "filename": "/5.3/datafiles/icons_svg/eyedropper.svg",
      "start": 28253171,
      "end": 28254446
    }, {
      "filename": "/5.3/datafiles/icons_svg/face_corner.svg",
      "start": 28254446,
      "end": 28255791
    }, {
      "filename": "/5.3/datafiles/icons_svg/face_maps.svg",
      "start": 28255791,
      "end": 28256685
    }, {
      "filename": "/5.3/datafiles/icons_svg/facesel.svg",
      "start": 28256685,
      "end": 28257718
    }, {
      "filename": "/5.3/datafiles/icons_svg/fake_user_off.svg",
      "start": 28257718,
      "end": 28259025
    }, {
      "filename": "/5.3/datafiles/icons_svg/fake_user_on.svg",
      "start": 28259025,
      "end": 28260107
    }, {
      "filename": "/5.3/datafiles/icons_svg/fcurve.svg",
      "start": 28260107,
      "end": 28261886
    }, {
      "filename": "/5.3/datafiles/icons_svg/fcurve_snapshot.svg",
      "start": 28261886,
      "end": 28263051
    }, {
      "filename": "/5.3/datafiles/icons_svg/ff.svg",
      "start": 28263051,
      "end": 28264063
    }, {
      "filename": "/5.3/datafiles/icons_svg/file.svg",
      "start": 28264063,
      "end": 28264956
    }, {
      "filename": "/5.3/datafiles/icons_svg/file_3d.svg",
      "start": 28264956,
      "end": 28266040
    }, {
      "filename": "/5.3/datafiles/icons_svg/file_alias.svg",
      "start": 28266040,
      "end": 28267750
    }, {
      "filename": "/5.3/datafiles/icons_svg/file_archive.svg",
      "start": 28267750,
      "end": 28268877
    }, {
      "filename": "/5.3/datafiles/icons_svg/file_backup.svg",
      "start": 28268877,
      "end": 28272411
    }, {
      "filename": "/5.3/datafiles/icons_svg/file_blank.svg",
      "start": 28272411,
      "end": 28273317
    }, {
      "filename": "/5.3/datafiles/icons_svg/file_blend.svg",
      "start": 28273317,
      "end": 28276156
    }, {
      "filename": "/5.3/datafiles/icons_svg/file_cache.svg",
      "start": 28276156,
      "end": 28278454
    }, {
      "filename": "/5.3/datafiles/icons_svg/file_folder.svg",
      "start": 28278454,
      "end": 28279271
    }, {
      "filename": "/5.3/datafiles/icons_svg/file_folder_large.svg",
      "start": 28279271,
      "end": 28280743
    }, {
      "filename": "/5.3/datafiles/icons_svg/file_font.svg",
      "start": 28280743,
      "end": 28282146
    }, {
      "filename": "/5.3/datafiles/icons_svg/file_hidden.svg",
      "start": 28282146,
      "end": 28284180
    }, {
      "filename": "/5.3/datafiles/icons_svg/file_image.svg",
      "start": 28284180,
      "end": 28285295
    }, {
      "filename": "/5.3/datafiles/icons_svg/file_large.svg",
      "start": 28285295,
      "end": 28286955
    }, {
      "filename": "/5.3/datafiles/icons_svg/file_movie.svg",
      "start": 28286955,
      "end": 28288060
    }, {
      "filename": "/5.3/datafiles/icons_svg/file_new.svg",
      "start": 28288060,
      "end": 28289122
    }, {
      "filename": "/5.3/datafiles/icons_svg/file_parent.svg",
      "start": 28289122,
      "end": 28289991
    }, {
      "filename": "/5.3/datafiles/icons_svg/file_parent_large.svg",
      "start": 28289991,
      "end": 28291623
    }, {
      "filename": "/5.3/datafiles/icons_svg/file_refresh.svg",
      "start": 28291623,
      "end": 28293092
    }, {
      "filename": "/5.3/datafiles/icons_svg/file_script.svg",
      "start": 28293092,
      "end": 28294790
    }, {
      "filename": "/5.3/datafiles/icons_svg/file_sound.svg",
      "start": 28294790,
      "end": 28295808
    }, {
      "filename": "/5.3/datafiles/icons_svg/file_text.svg",
      "start": 28295808,
      "end": 28297145
    }, {
      "filename": "/5.3/datafiles/icons_svg/file_tick.svg",
      "start": 28297145,
      "end": 28298014
    }, {
      "filename": "/5.3/datafiles/icons_svg/file_volume.svg",
      "start": 28298014,
      "end": 28300763
    }, {
      "filename": "/5.3/datafiles/icons_svg/filebrowser.svg",
      "start": 28300763,
      "end": 28301580
    }, {
      "filename": "/5.3/datafiles/icons_svg/filter.svg",
      "start": 28301580,
      "end": 28302480
    }, {
      "filename": "/5.3/datafiles/icons_svg/filter_filled.svg",
      "start": 28302480,
      "end": 28303810
    }, {
      "filename": "/5.3/datafiles/icons_svg/fixed_size.svg",
      "start": 28303810,
      "end": 28304564
    }, {
      "filename": "/5.3/datafiles/icons_svg/folder_redirect.svg",
      "start": 28304564,
      "end": 28305494
    }, {
      "filename": "/5.3/datafiles/icons_svg/font_data.svg",
      "start": 28305494,
      "end": 28306942
    }, {
      "filename": "/5.3/datafiles/icons_svg/fontpreview.svg",
      "start": 28306942,
      "end": 28308893
    }, {
      "filename": "/5.3/datafiles/icons_svg/force_boid.svg",
      "start": 28308893,
      "end": 28310832
    }, {
      "filename": "/5.3/datafiles/icons_svg/force_charge.svg",
      "start": 28310832,
      "end": 28311905
    }, {
      "filename": "/5.3/datafiles/icons_svg/force_curve.svg",
      "start": 28311905,
      "end": 28312920
    }, {
      "filename": "/5.3/datafiles/icons_svg/force_drag.svg",
      "start": 28312920,
      "end": 28314515
    }, {
      "filename": "/5.3/datafiles/icons_svg/force_fluidflow.svg",
      "start": 28314515,
      "end": 28316714
    }, {
      "filename": "/5.3/datafiles/icons_svg/force_force.svg",
      "start": 28316714,
      "end": 28318421
    }, {
      "filename": "/5.3/datafiles/icons_svg/force_harmonic.svg",
      "start": 28318421,
      "end": 28320114
    }, {
      "filename": "/5.3/datafiles/icons_svg/force_lennardjones.svg",
      "start": 28320114,
      "end": 28321614
    }, {
      "filename": "/5.3/datafiles/icons_svg/force_magnetic.svg",
      "start": 28321614,
      "end": 28323758
    }, {
      "filename": "/5.3/datafiles/icons_svg/force_texture.svg",
      "start": 28323758,
      "end": 28324659
    }, {
      "filename": "/5.3/datafiles/icons_svg/force_turbulence.svg",
      "start": 28324659,
      "end": 28326653
    }, {
      "filename": "/5.3/datafiles/icons_svg/force_vortex.svg",
      "start": 28326653,
      "end": 28328140
    }, {
      "filename": "/5.3/datafiles/icons_svg/force_wind.svg",
      "start": 28328140,
      "end": 28329814
    }, {
      "filename": "/5.3/datafiles/icons_svg/forward.svg",
      "start": 28329814,
      "end": 28330621
    }, {
      "filename": "/5.3/datafiles/icons_svg/frame_next.svg",
      "start": 28330621,
      "end": 28331669
    }, {
      "filename": "/5.3/datafiles/icons_svg/frame_prev.svg",
      "start": 28331669,
      "end": 28332731
    }, {
      "filename": "/5.3/datafiles/icons_svg/freeze.svg",
      "start": 28332731,
      "end": 28334494
    }, {
      "filename": "/5.3/datafiles/icons_svg/fullscreen_enter.svg",
      "start": 28334494,
      "end": 28335589
    }, {
      "filename": "/5.3/datafiles/icons_svg/fullscreen_exit.svg",
      "start": 28335589,
      "end": 28336684
    }, {
      "filename": "/5.3/datafiles/icons_svg/fund.svg",
      "start": 28336684,
      "end": 28337640
    }, {
      "filename": "/5.3/datafiles/icons_svg/geometry_nodes.svg",
      "start": 28337640,
      "end": 28338953
    }, {
      "filename": "/5.3/datafiles/icons_svg/geometry_set.svg",
      "start": 28338953,
      "end": 28340837
    }, {
      "filename": "/5.3/datafiles/icons_svg/gesture_pan.svg",
      "start": 28340837,
      "end": 28341793
    }, {
      "filename": "/5.3/datafiles/icons_svg/gesture_rotate.svg",
      "start": 28341793,
      "end": 28342968
    }, {
      "filename": "/5.3/datafiles/icons_svg/gesture_zoom.svg",
      "start": 28342968,
      "end": 28343934
    }, {
      "filename": "/5.3/datafiles/icons_svg/ghost_disabled.svg",
      "start": 28343934,
      "end": 28346070
    }, {
      "filename": "/5.3/datafiles/icons_svg/ghost_enabled.svg",
      "start": 28346070,
      "end": 28347382
    }, {
      "filename": "/5.3/datafiles/icons_svg/gizmo.svg",
      "start": 28347382,
      "end": 28348572
    }, {
      "filename": "/5.3/datafiles/icons_svg/gp_caps_flat.svg",
      "start": 28348572,
      "end": 28349635
    }, {
      "filename": "/5.3/datafiles/icons_svg/gp_caps_round.svg",
      "start": 28349635,
      "end": 28350514
    }, {
      "filename": "/5.3/datafiles/icons_svg/gp_draw_both.svg",
      "start": 28350514,
      "end": 28351519
    }, {
      "filename": "/5.3/datafiles/icons_svg/gp_draw_fill.svg",
      "start": 28351519,
      "end": 28352183
    }, {
      "filename": "/5.3/datafiles/icons_svg/gp_draw_stroke.svg",
      "start": 28352183,
      "end": 28352845
    }, {
      "filename": "/5.3/datafiles/icons_svg/gp_multiframe_editing.svg",
      "start": 28352845,
      "end": 28354165
    }, {
      "filename": "/5.3/datafiles/icons_svg/gp_only_selected.svg",
      "start": 28354165,
      "end": 28355824
    }, {
      "filename": "/5.3/datafiles/icons_svg/gp_select_between_strokes.svg",
      "start": 28355824,
      "end": 28357215
    }, {
      "filename": "/5.3/datafiles/icons_svg/gp_select_points.svg",
      "start": 28357215,
      "end": 28358726
    }, {
      "filename": "/5.3/datafiles/icons_svg/gp_select_strokes.svg",
      "start": 28358726,
      "end": 28360210
    }, {
      "filename": "/5.3/datafiles/icons_svg/graph.svg",
      "start": 28360210,
      "end": 28361934
    }, {
      "filename": "/5.3/datafiles/icons_svg/greasepencil.svg",
      "start": 28361934,
      "end": 28362991
    }, {
      "filename": "/5.3/datafiles/icons_svg/greasepencil_layer_group.svg",
      "start": 28362991,
      "end": 28366449
    }, {
      "filename": "/5.3/datafiles/icons_svg/grid.svg",
      "start": 28366449,
      "end": 28367523
    }, {
      "filename": "/5.3/datafiles/icons_svg/grip.svg",
      "start": 28367523,
      "end": 28368357
    }, {
      "filename": "/5.3/datafiles/icons_svg/grip_corner_bottom_right.svg",
      "start": 28368357,
      "end": 28369198
    }, {
      "filename": "/5.3/datafiles/icons_svg/grip_v.svg",
      "start": 28369198,
      "end": 28369876
    }, {
      "filename": "/5.3/datafiles/icons_svg/group.svg",
      "start": 28369876,
      "end": 28370673
    }, {
      "filename": "/5.3/datafiles/icons_svg/group_bone.svg",
      "start": 28370673,
      "end": 28373423
    }, {
      "filename": "/5.3/datafiles/icons_svg/group_uvs.svg",
      "start": 28373423,
      "end": 28374545
    }, {
      "filename": "/5.3/datafiles/icons_svg/group_vcol.svg",
      "start": 28374545,
      "end": 28376732
    }, {
      "filename": "/5.3/datafiles/icons_svg/group_vertex.svg",
      "start": 28376732,
      "end": 28378839
    }, {
      "filename": "/5.3/datafiles/icons_svg/hand.svg",
      "start": 28378839,
      "end": 28380576
    }, {
      "filename": "/5.3/datafiles/icons_svg/handle_aligned.svg",
      "start": 28380576,
      "end": 28382133
    }, {
      "filename": "/5.3/datafiles/icons_svg/handle_auto.svg",
      "start": 28382133,
      "end": 28383226
    }, {
      "filename": "/5.3/datafiles/icons_svg/handle_autoclamped.svg",
      "start": 28383226,
      "end": 28384498
    }, {
      "filename": "/5.3/datafiles/icons_svg/handle_free.svg",
      "start": 28384498,
      "end": 28386310
    }, {
      "filename": "/5.3/datafiles/icons_svg/handle_vector.svg",
      "start": 28386310,
      "end": 28387428
    }, {
      "filename": "/5.3/datafiles/icons_svg/heart.svg",
      "start": 28387428,
      "end": 28388818
    }, {
      "filename": "/5.3/datafiles/icons_svg/help.svg",
      "start": 28388818,
      "end": 28389831
    }, {
      "filename": "/5.3/datafiles/icons_svg/hide_off.svg",
      "start": 28389831,
      "end": 28390889
    }, {
      "filename": "/5.3/datafiles/icons_svg/hide_on.svg",
      "start": 28390889,
      "end": 28391702
    }, {
      "filename": "/5.3/datafiles/icons_svg/holdout_off.svg",
      "start": 28391702,
      "end": 28392570
    }, {
      "filename": "/5.3/datafiles/icons_svg/holdout_on.svg",
      "start": 28392570,
      "end": 28393280
    }, {
      "filename": "/5.3/datafiles/icons_svg/home.svg",
      "start": 28393280,
      "end": 28394188
    }, {
      "filename": "/5.3/datafiles/icons_svg/hook.svg",
      "start": 28394188,
      "end": 28395737
    }, {
      "filename": "/5.3/datafiles/icons_svg/image.svg",
      "start": 28395737,
      "end": 28396699
    }, {
      "filename": "/5.3/datafiles/icons_svg/image_alpha.svg",
      "start": 28396699,
      "end": 28398206
    }, {
      "filename": "/5.3/datafiles/icons_svg/image_background.svg",
      "start": 28398206,
      "end": 28399491
    }, {
      "filename": "/5.3/datafiles/icons_svg/image_data.svg",
      "start": 28399491,
      "end": 28400606
    }, {
      "filename": "/5.3/datafiles/icons_svg/image_plane.svg",
      "start": 28400606,
      "end": 28401736
    }, {
      "filename": "/5.3/datafiles/icons_svg/image_reference.svg",
      "start": 28401736,
      "end": 28403031
    }, {
      "filename": "/5.3/datafiles/icons_svg/image_rgb.svg",
      "start": 28403031,
      "end": 28404316
    }, {
      "filename": "/5.3/datafiles/icons_svg/image_rgb_alpha.svg",
      "start": 28404316,
      "end": 28406148
    }, {
      "filename": "/5.3/datafiles/icons_svg/image_zdepth.svg",
      "start": 28406148,
      "end": 28406912
    }, {
      "filename": "/5.3/datafiles/icons_svg/imgdisplay.svg",
      "start": 28406912,
      "end": 28407998
    }, {
      "filename": "/5.3/datafiles/icons_svg/import.svg",
      "start": 28407998,
      "end": 28409099
    }, {
      "filename": "/5.3/datafiles/icons_svg/indirect_only_off.svg",
      "start": 28409099,
      "end": 28409917
    }, {
      "filename": "/5.3/datafiles/icons_svg/indirect_only_on.svg",
      "start": 28409917,
      "end": 28410772
    }, {
      "filename": "/5.3/datafiles/icons_svg/info.svg",
      "start": 28410772,
      "end": 28411515
    }, {
      "filename": "/5.3/datafiles/icons_svg/info_large.svg",
      "start": 28411515,
      "end": 28413259
    }, {
      "filename": "/5.3/datafiles/icons_svg/internet.svg",
      "start": 28413259,
      "end": 28415962
    }, {
      "filename": "/5.3/datafiles/icons_svg/internet_offline.svg",
      "start": 28415962,
      "end": 28419223
    }, {
      "filename": "/5.3/datafiles/icons_svg/inversesquarecurve.svg",
      "start": 28419223,
      "end": 28420291
    }, {
      "filename": "/5.3/datafiles/icons_svg/ipo_back.svg",
      "start": 28420291,
      "end": 28421416
    }, {
      "filename": "/5.3/datafiles/icons_svg/ipo_bezier.svg",
      "start": 28421416,
      "end": 28422744
    }, {
      "filename": "/5.3/datafiles/icons_svg/ipo_bounce.svg",
      "start": 28422744,
      "end": 28424320
    }, {
      "filename": "/5.3/datafiles/icons_svg/ipo_circ.svg",
      "start": 28424320,
      "end": 28425124
    }, {
      "filename": "/5.3/datafiles/icons_svg/ipo_constant.svg",
      "start": 28425124,
      "end": 28425774
    }, {
      "filename": "/5.3/datafiles/icons_svg/ipo_cubic.svg",
      "start": 28425774,
      "end": 28427464
    }, {
      "filename": "/5.3/datafiles/icons_svg/ipo_ease_in.svg",
      "start": 28427464,
      "end": 28428236
    }, {
      "filename": "/5.3/datafiles/icons_svg/ipo_ease_in_out.svg",
      "start": 28428236,
      "end": 28429096
    }, {
      "filename": "/5.3/datafiles/icons_svg/ipo_ease_out.svg",
      "start": 28429096,
      "end": 28429871
    }, {
      "filename": "/5.3/datafiles/icons_svg/ipo_elastic.svg",
      "start": 28429871,
      "end": 28432349
    }, {
      "filename": "/5.3/datafiles/icons_svg/ipo_expo.svg",
      "start": 28432349,
      "end": 28433216
    }, {
      "filename": "/5.3/datafiles/icons_svg/ipo_linear.svg",
      "start": 28433216,
      "end": 28433912
    }, {
      "filename": "/5.3/datafiles/icons_svg/ipo_quad.svg",
      "start": 28433912,
      "end": 28435429
    }, {
      "filename": "/5.3/datafiles/icons_svg/ipo_quart.svg",
      "start": 28435429,
      "end": 28436583
    }, {
      "filename": "/5.3/datafiles/icons_svg/ipo_quint.svg",
      "start": 28436583,
      "end": 28437854
    }, {
      "filename": "/5.3/datafiles/icons_svg/ipo_sine.svg",
      "start": 28437854,
      "end": 28438947
    }, {
      "filename": "/5.3/datafiles/icons_svg/italic.svg",
      "start": 28438947,
      "end": 28439801
    }, {
      "filename": "/5.3/datafiles/icons_svg/key_backspace.svg",
      "start": 28439801,
      "end": 28440927
    }, {
      "filename": "/5.3/datafiles/icons_svg/key_backspace_filled.svg",
      "start": 28440927,
      "end": 28442254
    }, {
      "filename": "/5.3/datafiles/icons_svg/key_command.svg",
      "start": 28442254,
      "end": 28445996
    }, {
      "filename": "/5.3/datafiles/icons_svg/key_command_filled.svg",
      "start": 28445996,
      "end": 28449629
    }, {
      "filename": "/5.3/datafiles/icons_svg/key_control.svg",
      "start": 28449629,
      "end": 28452144
    }, {
      "filename": "/5.3/datafiles/icons_svg/key_control_filled.svg",
      "start": 28452144,
      "end": 28454318
    }, {
      "filename": "/5.3/datafiles/icons_svg/key_dehlt.svg",
      "start": 28454318,
      "end": 28455765
    }, {
      "filename": "/5.3/datafiles/icons_svg/key_empty1.svg",
      "start": 28455765,
      "end": 28457757
    }, {
      "filename": "/5.3/datafiles/icons_svg/key_empty1_filled.svg",
      "start": 28457757,
      "end": 28460153
    }, {
      "filename": "/5.3/datafiles/icons_svg/key_empty2.svg",
      "start": 28460153,
      "end": 28462132
    }, {
      "filename": "/5.3/datafiles/icons_svg/key_empty2_filled.svg",
      "start": 28462132,
      "end": 28464512
    }, {
      "filename": "/5.3/datafiles/icons_svg/key_empty3.svg",
      "start": 28464512,
      "end": 28466491
    }, {
      "filename": "/5.3/datafiles/icons_svg/key_empty3_filled.svg",
      "start": 28466491,
      "end": 28468877
    }, {
      "filename": "/5.3/datafiles/icons_svg/key_hlt.svg",
      "start": 28468877,
      "end": 28470165
    }, {
      "filename": "/5.3/datafiles/icons_svg/key_menu.svg",
      "start": 28470165,
      "end": 28473319
    }, {
      "filename": "/5.3/datafiles/icons_svg/key_menu_filled.svg",
      "start": 28473319,
      "end": 28476845
    }, {
      "filename": "/5.3/datafiles/icons_svg/key_option.svg",
      "start": 28476845,
      "end": 28479153
    }, {
      "filename": "/5.3/datafiles/icons_svg/key_option_filled.svg",
      "start": 28479153,
      "end": 28481720
    }, {
      "filename": "/5.3/datafiles/icons_svg/key_return.svg",
      "start": 28481720,
      "end": 28483998
    }, {
      "filename": "/5.3/datafiles/icons_svg/key_return_filled.svg",
      "start": 28483998,
      "end": 28486784
    }, {
      "filename": "/5.3/datafiles/icons_svg/key_ring.svg",
      "start": 28486784,
      "end": 28488546
    }, {
      "filename": "/5.3/datafiles/icons_svg/key_ring_filled.svg",
      "start": 28488546,
      "end": 28490692
    }, {
      "filename": "/5.3/datafiles/icons_svg/key_shift.svg",
      "start": 28490692,
      "end": 28493433
    }, {
      "filename": "/5.3/datafiles/icons_svg/key_shift_filled.svg",
      "start": 28493433,
      "end": 28496825
    }, {
      "filename": "/5.3/datafiles/icons_svg/key_tab.svg",
      "start": 28496825,
      "end": 28499952
    }, {
      "filename": "/5.3/datafiles/icons_svg/key_tab_filled.svg",
      "start": 28499952,
      "end": 28503237
    }, {
      "filename": "/5.3/datafiles/icons_svg/key_windows.svg",
      "start": 28503237,
      "end": 28505066
    }, {
      "filename": "/5.3/datafiles/icons_svg/key_windows_filled.svg",
      "start": 28505066,
      "end": 28507236
    }, {
      "filename": "/5.3/datafiles/icons_svg/keyframe.svg",
      "start": 28507236,
      "end": 28508059
    }, {
      "filename": "/5.3/datafiles/icons_svg/keyframe_hlt.svg",
      "start": 28508059,
      "end": 28508814
    }, {
      "filename": "/5.3/datafiles/icons_svg/keyingset.svg",
      "start": 28508814,
      "end": 28510651
    }, {
      "filename": "/5.3/datafiles/icons_svg/lattice_data.svg",
      "start": 28510651,
      "end": 28511871
    }, {
      "filename": "/5.3/datafiles/icons_svg/layer_active.svg",
      "start": 28511871,
      "end": 28512437
    }, {
      "filename": "/5.3/datafiles/icons_svg/layer_used.svg",
      "start": 28512437,
      "end": 28513071
    }, {
      "filename": "/5.3/datafiles/icons_svg/library_data_broken.svg",
      "start": 28513071,
      "end": 28514361
    }, {
      "filename": "/5.3/datafiles/icons_svg/library_data_direct.svg",
      "start": 28514361,
      "end": 28516346
    }, {
      "filename": "/5.3/datafiles/icons_svg/library_data_override.svg",
      "start": 28516346,
      "end": 28518851
    }, {
      "filename": "/5.3/datafiles/icons_svg/light.svg",
      "start": 28518851,
      "end": 28520357
    }, {
      "filename": "/5.3/datafiles/icons_svg/light_area.svg",
      "start": 28520357,
      "end": 28521714
    }, {
      "filename": "/5.3/datafiles/icons_svg/light_data.svg",
      "start": 28521714,
      "end": 28523220
    }, {
      "filename": "/5.3/datafiles/icons_svg/light_hemi.svg",
      "start": 28523220,
      "end": 28525177
    }, {
      "filename": "/5.3/datafiles/icons_svg/light_point.svg",
      "start": 28525177,
      "end": 28526645
    }, {
      "filename": "/5.3/datafiles/icons_svg/light_spot.svg",
      "start": 28526645,
      "end": 28528444
    }, {
      "filename": "/5.3/datafiles/icons_svg/light_sun.svg",
      "start": 28528444,
      "end": 28530129
    }, {
      "filename": "/5.3/datafiles/icons_svg/lightprobe_plane.svg",
      "start": 28530129,
      "end": 28531058
    }, {
      "filename": "/5.3/datafiles/icons_svg/lightprobe_sphere.svg",
      "start": 28531058,
      "end": 28532196
    }, {
      "filename": "/5.3/datafiles/icons_svg/lightprobe_volume.svg",
      "start": 28532196,
      "end": 28534119
    }, {
      "filename": "/5.3/datafiles/icons_svg/lincurve.svg",
      "start": 28534119,
      "end": 28534840
    }, {
      "filename": "/5.3/datafiles/icons_svg/line_data.svg",
      "start": 28534840,
      "end": 28536468
    }, {
      "filename": "/5.3/datafiles/icons_svg/linenumbers_off.svg",
      "start": 28536468,
      "end": 28537334
    }, {
      "filename": "/5.3/datafiles/icons_svg/linenumbers_on.svg",
      "start": 28537334,
      "end": 28539060
    }, {
      "filename": "/5.3/datafiles/icons_svg/link_blend.svg",
      "start": 28539060,
      "end": 28541172
    }, {
      "filename": "/5.3/datafiles/icons_svg/linked.svg",
      "start": 28541172,
      "end": 28543242
    }, {
      "filename": "/5.3/datafiles/icons_svg/locked.svg",
      "start": 28543242,
      "end": 28544146
    }, {
      "filename": "/5.3/datafiles/icons_svg/lockview_off.svg",
      "start": 28544146,
      "end": 28545663
    }, {
      "filename": "/5.3/datafiles/icons_svg/lockview_on.svg",
      "start": 28545663,
      "end": 28547290
    }, {
      "filename": "/5.3/datafiles/icons_svg/longdisplay.svg",
      "start": 28547290,
      "end": 28548256
    }, {
      "filename": "/5.3/datafiles/icons_svg/loop_back.svg",
      "start": 28548256,
      "end": 28549150
    }, {
      "filename": "/5.3/datafiles/icons_svg/loop_forwards.svg",
      "start": 28549150,
      "end": 28550042
    }, {
      "filename": "/5.3/datafiles/icons_svg/marker.svg",
      "start": 28550042,
      "end": 28550831
    }, {
      "filename": "/5.3/datafiles/icons_svg/marker_hlt.svg",
      "start": 28550831,
      "end": 28551613
    }, {
      "filename": "/5.3/datafiles/icons_svg/mat_sphere_sky.svg",
      "start": 28551613,
      "end": 28552886
    }, {
      "filename": "/5.3/datafiles/icons_svg/matcloth.svg",
      "start": 28552886,
      "end": 28553912
    }, {
      "filename": "/5.3/datafiles/icons_svg/matcube.svg",
      "start": 28553912,
      "end": 28554948
    }, {
      "filename": "/5.3/datafiles/icons_svg/material.svg",
      "start": 28554948,
      "end": 28555740
    }, {
      "filename": "/5.3/datafiles/icons_svg/material_data.svg",
      "start": 28555740,
      "end": 28556532
    }, {
      "filename": "/5.3/datafiles/icons_svg/matfluid.svg",
      "start": 28556532,
      "end": 28557838
    }, {
      "filename": "/5.3/datafiles/icons_svg/matplane.svg",
      "start": 28557838,
      "end": 28558463
    }, {
      "filename": "/5.3/datafiles/icons_svg/matshaderball.svg",
      "start": 28558463,
      "end": 28560118
    }, {
      "filename": "/5.3/datafiles/icons_svg/matsphere.svg",
      "start": 28560118,
      "end": 28561248
    }, {
      "filename": "/5.3/datafiles/icons_svg/memory.svg",
      "start": 28561248,
      "end": 28562661
    }, {
      "filename": "/5.3/datafiles/icons_svg/menu_panel.svg",
      "start": 28562661,
      "end": 28563415
    }, {
      "filename": "/5.3/datafiles/icons_svg/mesh_capsule.svg",
      "start": 28563415,
      "end": 28564671
    }, {
      "filename": "/5.3/datafiles/icons_svg/mesh_circle.svg",
      "start": 28564671,
      "end": 28565331
    }, {
      "filename": "/5.3/datafiles/icons_svg/mesh_cone.svg",
      "start": 28565331,
      "end": 28566482
    }, {
      "filename": "/5.3/datafiles/icons_svg/mesh_cube.svg",
      "start": 28566482,
      "end": 28567508
    }, {
      "filename": "/5.3/datafiles/icons_svg/mesh_cylinder.svg",
      "start": 28567508,
      "end": 28569232
    }, {
      "filename": "/5.3/datafiles/icons_svg/mesh_data.svg",
      "start": 28569232,
      "end": 28570188
    }, {
      "filename": "/5.3/datafiles/icons_svg/mesh_grid.svg",
      "start": 28570188,
      "end": 28571270
    }, {
      "filename": "/5.3/datafiles/icons_svg/mesh_icosphere.svg",
      "start": 28571270,
      "end": 28572708
    }, {
      "filename": "/5.3/datafiles/icons_svg/mesh_monkey.svg",
      "start": 28572708,
      "end": 28575116
    }, {
      "filename": "/5.3/datafiles/icons_svg/mesh_plane.svg",
      "start": 28575116,
      "end": 28575743
    }, {
      "filename": "/5.3/datafiles/icons_svg/mesh_torus.svg",
      "start": 28575743,
      "end": 28577598
    }, {
      "filename": "/5.3/datafiles/icons_svg/mesh_uvsphere.svg",
      "start": 28577598,
      "end": 28579145
    }, {
      "filename": "/5.3/datafiles/icons_svg/meta_ball.svg",
      "start": 28579145,
      "end": 28580337
    }, {
      "filename": "/5.3/datafiles/icons_svg/meta_capsule.svg",
      "start": 28580337,
      "end": 28581972
    }, {
      "filename": "/5.3/datafiles/icons_svg/meta_cube.svg",
      "start": 28581972,
      "end": 28583473
    }, {
      "filename": "/5.3/datafiles/icons_svg/meta_data.svg",
      "start": 28583473,
      "end": 28584942
    }, {
      "filename": "/5.3/datafiles/icons_svg/meta_ellipsoid.svg",
      "start": 28584942,
      "end": 28586613
    }, {
      "filename": "/5.3/datafiles/icons_svg/meta_plane.svg",
      "start": 28586613,
      "end": 28587524
    }, {
      "filename": "/5.3/datafiles/icons_svg/mod_armature.svg",
      "start": 28587524,
      "end": 28589033
    }, {
      "filename": "/5.3/datafiles/icons_svg/mod_array.svg",
      "start": 28589033,
      "end": 28590160
    }, {
      "filename": "/5.3/datafiles/icons_svg/mod_bevel.svg",
      "start": 28590160,
      "end": 28591096
    }, {
      "filename": "/5.3/datafiles/icons_svg/mod_boolean.svg",
      "start": 28591096,
      "end": 28592040
    }, {
      "filename": "/5.3/datafiles/icons_svg/mod_brightness_contrast.svg",
      "start": 28592040,
      "end": 28594984
    }, {
      "filename": "/5.3/datafiles/icons_svg/mod_build.svg",
      "start": 28594984,
      "end": 28595982
    }, {
      "filename": "/5.3/datafiles/icons_svg/mod_cast.svg",
      "start": 28595982,
      "end": 28597177
    }, {
      "filename": "/5.3/datafiles/icons_svg/mod_cloth.svg",
      "start": 28597177,
      "end": 28598676
    }, {
      "filename": "/5.3/datafiles/icons_svg/mod_color_balance.svg",
      "start": 28598676,
      "end": 28604324
    }, {
      "filename": "/5.3/datafiles/icons_svg/mod_curve.svg",
      "start": 28604324,
      "end": 28605247
    }, {
      "filename": "/5.3/datafiles/icons_svg/mod_curve_to_tube.svg",
      "start": 28605247,
      "end": 28606930
    }, {
      "filename": "/5.3/datafiles/icons_svg/mod_curves.svg",
      "start": 28606930,
      "end": 28609264
    }, {
      "filename": "/5.3/datafiles/icons_svg/mod_dash.svg",
      "start": 28609264,
      "end": 28611647
    }, {
      "filename": "/5.3/datafiles/icons_svg/mod_data_transfer.svg",
      "start": 28611647,
      "end": 28612867
    }, {
      "filename": "/5.3/datafiles/icons_svg/mod_decim.svg",
      "start": 28612867,
      "end": 28613981
    }, {
      "filename": "/5.3/datafiles/icons_svg/mod_displace.svg",
      "start": 28613981,
      "end": 28615040
    }, {
      "filename": "/5.3/datafiles/icons_svg/mod_dynamicpaint.svg",
      "start": 28615040,
      "end": 28617229
    }, {
      "filename": "/5.3/datafiles/icons_svg/mod_edgesplit.svg",
      "start": 28617229,
      "end": 28618163
    }, {
      "filename": "/5.3/datafiles/icons_svg/mod_envelope.svg",
      "start": 28618163,
      "end": 28619613
    }, {
      "filename": "/5.3/datafiles/icons_svg/mod_explode.svg",
      "start": 28619613,
      "end": 28620818
    }, {
      "filename": "/5.3/datafiles/icons_svg/mod_fluid.svg",
      "start": 28620818,
      "end": 28623164
    }, {
      "filename": "/5.3/datafiles/icons_svg/mod_fluidsim.svg",
      "start": 28623164,
      "end": 28624470
    }, {
      "filename": "/5.3/datafiles/icons_svg/mod_hue_correct.svg",
      "start": 28624470,
      "end": 28626780
    }, {
      "filename": "/5.3/datafiles/icons_svg/mod_hue_saturation.svg",
      "start": 28626780,
      "end": 28628104
    }, {
      "filename": "/5.3/datafiles/icons_svg/mod_instance.svg",
      "start": 28628104,
      "end": 28629169
    }, {
      "filename": "/5.3/datafiles/icons_svg/mod_lattice.svg",
      "start": 28629169,
      "end": 28630049
    }, {
      "filename": "/5.3/datafiles/icons_svg/mod_length.svg",
      "start": 28630049,
      "end": 28631331
    }, {
      "filename": "/5.3/datafiles/icons_svg/mod_lineart.svg",
      "start": 28631331,
      "end": 28633063
    }, {
      "filename": "/5.3/datafiles/icons_svg/mod_mask.svg",
      "start": 28633063,
      "end": 28633809
    }, {
      "filename": "/5.3/datafiles/icons_svg/mod_meshdeform.svg",
      "start": 28633809,
      "end": 28635098
    }, {
      "filename": "/5.3/datafiles/icons_svg/mod_mirror.svg",
      "start": 28635098,
      "end": 28637113
    }, {
      "filename": "/5.3/datafiles/icons_svg/mod_multires.svg",
      "start": 28637113,
      "end": 28638155
    }, {
      "filename": "/5.3/datafiles/icons_svg/mod_noise.svg",
      "start": 28638155,
      "end": 28639811
    }, {
      "filename": "/5.3/datafiles/icons_svg/mod_normaledit.svg",
      "start": 28639811,
      "end": 28641040
    }, {
      "filename": "/5.3/datafiles/icons_svg/mod_ocean.svg",
      "start": 28641040,
      "end": 28643361
    }, {
      "filename": "/5.3/datafiles/icons_svg/mod_offset.svg",
      "start": 28643361,
      "end": 28644434
    }, {
      "filename": "/5.3/datafiles/icons_svg/mod_opacity.svg",
      "start": 28644434,
      "end": 28645452
    }, {
      "filename": "/5.3/datafiles/icons_svg/mod_outline.svg",
      "start": 28645452,
      "end": 28647382
    }, {
      "filename": "/5.3/datafiles/icons_svg/mod_particle_instance.svg",
      "start": 28647382,
      "end": 28649625
    }, {
      "filename": "/5.3/datafiles/icons_svg/mod_particles.svg",
      "start": 28649625,
      "end": 28651206
    }, {
      "filename": "/5.3/datafiles/icons_svg/mod_physics.svg",
      "start": 28651206,
      "end": 28652901
    }, {
      "filename": "/5.3/datafiles/icons_svg/mod_remesh.svg",
      "start": 28652901,
      "end": 28654156
    }, {
      "filename": "/5.3/datafiles/icons_svg/mod_scatter_on_surface.svg",
      "start": 28654156,
      "end": 28655899
    }, {
      "filename": "/5.3/datafiles/icons_svg/mod_screw.svg",
      "start": 28655899,
      "end": 28658378
    }, {
      "filename": "/5.3/datafiles/icons_svg/mod_shrinkwrap.svg",
      "start": 28658378,
      "end": 28659513
    }, {
      "filename": "/5.3/datafiles/icons_svg/mod_simpledeform.svg",
      "start": 28659513,
      "end": 28660638
    }, {
      "filename": "/5.3/datafiles/icons_svg/mod_simplify.svg",
      "start": 28660638,
      "end": 28661850
    }, {
      "filename": "/5.3/datafiles/icons_svg/mod_skin.svg",
      "start": 28661850,
      "end": 28663601
    }, {
      "filename": "/5.3/datafiles/icons_svg/mod_smooth.svg",
      "start": 28663601,
      "end": 28664521
    }, {
      "filename": "/5.3/datafiles/icons_svg/mod_soft.svg",
      "start": 28664521,
      "end": 28666777
    }, {
      "filename": "/5.3/datafiles/icons_svg/mod_solidify.svg",
      "start": 28666777,
      "end": 28667730
    }, {
      "filename": "/5.3/datafiles/icons_svg/mod_subsurf.svg",
      "start": 28667730,
      "end": 28668642
    }, {
      "filename": "/5.3/datafiles/icons_svg/mod_thickness.svg",
      "start": 28668642,
      "end": 28669557
    }, {
      "filename": "/5.3/datafiles/icons_svg/mod_time.svg",
      "start": 28669557,
      "end": 28670704
    }, {
      "filename": "/5.3/datafiles/icons_svg/mod_tint.svg",
      "start": 28670704,
      "end": 28672009
    }, {
      "filename": "/5.3/datafiles/icons_svg/mod_tonemap.svg",
      "start": 28672009,
      "end": 28673622
    }, {
      "filename": "/5.3/datafiles/icons_svg/mod_triangulate.svg",
      "start": 28673622,
      "end": 28674568
    }, {
      "filename": "/5.3/datafiles/icons_svg/mod_uvproject.svg",
      "start": 28674568,
      "end": 28675491
    }, {
      "filename": "/5.3/datafiles/icons_svg/mod_vertex_weight.svg",
      "start": 28675491,
      "end": 28676908
    }, {
      "filename": "/5.3/datafiles/icons_svg/mod_warp.svg",
      "start": 28676908,
      "end": 28678173
    }, {
      "filename": "/5.3/datafiles/icons_svg/mod_wave.svg",
      "start": 28678173,
      "end": 28679572
    }, {
      "filename": "/5.3/datafiles/icons_svg/mod_white_balance.svg",
      "start": 28679572,
      "end": 28681767
    }, {
      "filename": "/5.3/datafiles/icons_svg/mod_wireframe.svg",
      "start": 28681767,
      "end": 28682820
    }, {
      "filename": "/5.3/datafiles/icons_svg/modifier.svg",
      "start": 28682820,
      "end": 28683933
    }, {
      "filename": "/5.3/datafiles/icons_svg/modifier_data.svg",
      "start": 28683933,
      "end": 28685953
    }, {
      "filename": "/5.3/datafiles/icons_svg/modifier_off.svg",
      "start": 28685953,
      "end": 28687514
    }, {
      "filename": "/5.3/datafiles/icons_svg/modifier_on.svg",
      "start": 28687514,
      "end": 28688606
    }, {
      "filename": "/5.3/datafiles/icons_svg/monkey.svg",
      "start": 28688606,
      "end": 28691076
    }, {
      "filename": "/5.3/datafiles/icons_svg/mouse_lmb.svg",
      "start": 28691076,
      "end": 28692222
    }, {
      "filename": "/5.3/datafiles/icons_svg/mouse_lmb_2x.svg",
      "start": 28692222,
      "end": 28694507
    }, {
      "filename": "/5.3/datafiles/icons_svg/mouse_lmb_drag.svg",
      "start": 28694507,
      "end": 28696094
    }, {
      "filename": "/5.3/datafiles/icons_svg/mouse_mmb.svg",
      "start": 28696094,
      "end": 28697276
    }, {
      "filename": "/5.3/datafiles/icons_svg/mouse_mmb_drag.svg",
      "start": 28697276,
      "end": 28698873
    }, {
      "filename": "/5.3/datafiles/icons_svg/mouse_mmb_scroll.svg",
      "start": 28698873,
      "end": 28700416
    }, {
      "filename": "/5.3/datafiles/icons_svg/mouse_move.svg",
      "start": 28700416,
      "end": 28701810
    }, {
      "filename": "/5.3/datafiles/icons_svg/mouse_rmb.svg",
      "start": 28701810,
      "end": 28702942
    }, {
      "filename": "/5.3/datafiles/icons_svg/mouse_rmb_drag.svg",
      "start": 28702942,
      "end": 28704521
    }, {
      "filename": "/5.3/datafiles/icons_svg/mute_ipo_off.svg",
      "start": 28704521,
      "end": 28705397
    }, {
      "filename": "/5.3/datafiles/icons_svg/mute_ipo_on.svg",
      "start": 28705397,
      "end": 28706549
    }, {
      "filename": "/5.3/datafiles/icons_svg/network_drive.svg",
      "start": 28706549,
      "end": 28708686
    }, {
      "filename": "/5.3/datafiles/icons_svg/network_drive_large.svg",
      "start": 28708686,
      "end": 28712757
    }, {
      "filename": "/5.3/datafiles/icons_svg/newfolder.svg",
      "start": 28712757,
      "end": 28713735
    }, {
      "filename": "/5.3/datafiles/icons_svg/next_keyframe.svg",
      "start": 28713735,
      "end": 28714832
    }, {
      "filename": "/5.3/datafiles/icons_svg/nla.svg",
      "start": 28714832,
      "end": 28715966
    }, {
      "filename": "/5.3/datafiles/icons_svg/nla_pushdown.svg",
      "start": 28715966,
      "end": 28717015
    }, {
      "filename": "/5.3/datafiles/icons_svg/nocurve.svg",
      "start": 28717015,
      "end": 28717644
    }, {
      "filename": "/5.3/datafiles/icons_svg/node.svg",
      "start": 28717644,
      "end": 28718502
    }, {
      "filename": "/5.3/datafiles/icons_svg/node_compositing.svg",
      "start": 28718502,
      "end": 28719670
    }, {
      "filename": "/5.3/datafiles/icons_svg/node_corner.svg",
      "start": 28719670,
      "end": 28721031
    }, {
      "filename": "/5.3/datafiles/icons_svg/node_insert_off.svg",
      "start": 28721031,
      "end": 28723838
    }, {
      "filename": "/5.3/datafiles/icons_svg/node_insert_on.svg",
      "start": 28723838,
      "end": 28725549
    }, {
      "filename": "/5.3/datafiles/icons_svg/node_material.svg",
      "start": 28725549,
      "end": 28726975
    }, {
      "filename": "/5.3/datafiles/icons_svg/node_sel.svg",
      "start": 28726975,
      "end": 28727918
    }, {
      "filename": "/5.3/datafiles/icons_svg/node_side.svg",
      "start": 28727918,
      "end": 28729068
    }, {
      "filename": "/5.3/datafiles/icons_svg/node_texture.svg",
      "start": 28729068,
      "end": 28730025
    }, {
      "filename": "/5.3/datafiles/icons_svg/node_top.svg",
      "start": 28730025,
      "end": 28731198
    }, {
      "filename": "/5.3/datafiles/icons_svg/nodetree.svg",
      "start": 28731198,
      "end": 28732743
    }, {
      "filename": "/5.3/datafiles/icons_svg/none.svg",
      "start": 28732743,
      "end": 28733156
    }, {
      "filename": "/5.3/datafiles/icons_svg/normalize_fcurves.svg",
      "start": 28733156,
      "end": 28734914
    }, {
      "filename": "/5.3/datafiles/icons_svg/normals_face.svg",
      "start": 28734914,
      "end": 28736014
    }, {
      "filename": "/5.3/datafiles/icons_svg/normals_vertex.svg",
      "start": 28736014,
      "end": 28737342
    }, {
      "filename": "/5.3/datafiles/icons_svg/normals_vertex_face.svg",
      "start": 28737342,
      "end": 28738347
    }, {
      "filename": "/5.3/datafiles/icons_svg/not_found.svg",
      "start": 28738347,
      "end": 28740437
    }, {
      "filename": "/5.3/datafiles/icons_svg/object_data.svg",
      "start": 28740437,
      "end": 28741330
    }, {
      "filename": "/5.3/datafiles/icons_svg/object_datamode.svg",
      "start": 28741330,
      "end": 28742223
    }, {
      "filename": "/5.3/datafiles/icons_svg/object_hidden.svg",
      "start": 28742223,
      "end": 28743230
    }, {
      "filename": "/5.3/datafiles/icons_svg/object_origin.svg",
      "start": 28743230,
      "end": 28744768
    }, {
      "filename": "/5.3/datafiles/icons_svg/onionskin_off.svg",
      "start": 28744768,
      "end": 28745575
    }, {
      "filename": "/5.3/datafiles/icons_svg/onionskin_on.svg",
      "start": 28745575,
      "end": 28747112
    }, {
      "filename": "/5.3/datafiles/icons_svg/options.svg",
      "start": 28747112,
      "end": 28748195
    }, {
      "filename": "/5.3/datafiles/icons_svg/orientation_cursor.svg",
      "start": 28748195,
      "end": 28749975
    }, {
      "filename": "/5.3/datafiles/icons_svg/orientation_gimbal.svg",
      "start": 28749975,
      "end": 28752229
    }, {
      "filename": "/5.3/datafiles/icons_svg/orientation_global.svg",
      "start": 28752229,
      "end": 28753814
    }, {
      "filename": "/5.3/datafiles/icons_svg/orientation_local.svg",
      "start": 28753814,
      "end": 28755223
    }, {
      "filename": "/5.3/datafiles/icons_svg/orientation_normal.svg",
      "start": 28755223,
      "end": 28756674
    }, {
      "filename": "/5.3/datafiles/icons_svg/orientation_parent.svg",
      "start": 28756674,
      "end": 28759698
    }, {
      "filename": "/5.3/datafiles/icons_svg/orientation_view.svg",
      "start": 28759698,
      "end": 28760896
    }, {
      "filename": "/5.3/datafiles/icons_svg/orphan_data.svg",
      "start": 28760896,
      "end": 28762297
    }, {
      "filename": "/5.3/datafiles/icons_svg/outliner.svg",
      "start": 28762297,
      "end": 28763367
    }, {
      "filename": "/5.3/datafiles/icons_svg/outliner_collection.svg",
      "start": 28763367,
      "end": 28764804
    }, {
      "filename": "/5.3/datafiles/icons_svg/outliner_data_armature.svg",
      "start": 28764804,
      "end": 28766426
    }, {
      "filename": "/5.3/datafiles/icons_svg/outliner_data_camera.svg",
      "start": 28766426,
      "end": 28768345
    }, {
      "filename": "/5.3/datafiles/icons_svg/outliner_data_curve.svg",
      "start": 28768345,
      "end": 28769505
    }, {
      "filename": "/5.3/datafiles/icons_svg/outliner_data_curves.svg",
      "start": 28769505,
      "end": 28770649
    }, {
      "filename": "/5.3/datafiles/icons_svg/outliner_data_empty.svg",
      "start": 28770649,
      "end": 28771360
    }, {
      "filename": "/5.3/datafiles/icons_svg/outliner_data_font.svg",
      "start": 28771360,
      "end": 28772740
    }, {
      "filename": "/5.3/datafiles/icons_svg/outliner_data_gp_layer.svg",
      "start": 28772740,
      "end": 28773598
    }, {
      "filename": "/5.3/datafiles/icons_svg/outliner_data_greasepencil.svg",
      "start": 28773598,
      "end": 28775235
    }, {
      "filename": "/5.3/datafiles/icons_svg/outliner_data_lattice.svg",
      "start": 28775235,
      "end": 28776398
    }, {
      "filename": "/5.3/datafiles/icons_svg/outliner_data_light.svg",
      "start": 28776398,
      "end": 28777904
    }, {
      "filename": "/5.3/datafiles/icons_svg/outliner_data_lightprobe.svg",
      "start": 28777904,
      "end": 28779184
    }, {
      "filename": "/5.3/datafiles/icons_svg/outliner_data_mesh.svg",
      "start": 28779184,
      "end": 28780143
    }, {
      "filename": "/5.3/datafiles/icons_svg/outliner_data_meta.svg",
      "start": 28780143,
      "end": 28781721
    }, {
      "filename": "/5.3/datafiles/icons_svg/outliner_data_pointcloud.svg",
      "start": 28781721,
      "end": 28782854
    }, {
      "filename": "/5.3/datafiles/icons_svg/outliner_data_speaker.svg",
      "start": 28782854,
      "end": 28784138
    }, {
      "filename": "/5.3/datafiles/icons_svg/outliner_data_surface.svg",
      "start": 28784138,
      "end": 28785716
    }, {
      "filename": "/5.3/datafiles/icons_svg/outliner_data_volume.svg",
      "start": 28785716,
      "end": 28787984
    }, {
      "filename": "/5.3/datafiles/icons_svg/outliner_ob_armature.svg",
      "start": 28787984,
      "end": 28789332
    }, {
      "filename": "/5.3/datafiles/icons_svg/outliner_ob_camera.svg",
      "start": 28789332,
      "end": 28790948
    }, {
      "filename": "/5.3/datafiles/icons_svg/outliner_ob_curve.svg",
      "start": 28790948,
      "end": 28791917
    }, {
      "filename": "/5.3/datafiles/icons_svg/outliner_ob_curves.svg",
      "start": 28791917,
      "end": 28793239
    }, {
      "filename": "/5.3/datafiles/icons_svg/outliner_ob_empty.svg",
      "start": 28793239,
      "end": 28793972
    }, {
      "filename": "/5.3/datafiles/icons_svg/outliner_ob_font.svg",
      "start": 28793972,
      "end": 28795487
    }, {
      "filename": "/5.3/datafiles/icons_svg/outliner_ob_force_field.svg",
      "start": 28795487,
      "end": 28796929
    }, {
      "filename": "/5.3/datafiles/icons_svg/outliner_ob_greasepencil.svg",
      "start": 28796929,
      "end": 28798635
    }, {
      "filename": "/5.3/datafiles/icons_svg/outliner_ob_group_instance.svg",
      "start": 28798635,
      "end": 28799676
    }, {
      "filename": "/5.3/datafiles/icons_svg/outliner_ob_image.svg",
      "start": 28799676,
      "end": 28800605
    }, {
      "filename": "/5.3/datafiles/icons_svg/outliner_ob_lattice.svg",
      "start": 28800605,
      "end": 28801952
    }, {
      "filename": "/5.3/datafiles/icons_svg/outliner_ob_light.svg",
      "start": 28801952,
      "end": 28803092
    }, {
      "filename": "/5.3/datafiles/icons_svg/outliner_ob_lightprobe.svg",
      "start": 28803092,
      "end": 28804758
    }, {
      "filename": "/5.3/datafiles/icons_svg/outliner_ob_mesh.svg",
      "start": 28804758,
      "end": 28805432
    }, {
      "filename": "/5.3/datafiles/icons_svg/outliner_ob_meta.svg",
      "start": 28805432,
      "end": 28806470
    }, {
      "filename": "/5.3/datafiles/icons_svg/outliner_ob_pointcloud.svg",
      "start": 28806470,
      "end": 28807368
    }, {
      "filename": "/5.3/datafiles/icons_svg/outliner_ob_speaker.svg",
      "start": 28807368,
      "end": 28808562
    }, {
      "filename": "/5.3/datafiles/icons_svg/outliner_ob_surface.svg",
      "start": 28808562,
      "end": 28809544
    }, {
      "filename": "/5.3/datafiles/icons_svg/outliner_ob_volume.svg",
      "start": 28809544,
      "end": 28810714
    }, {
      "filename": "/5.3/datafiles/icons_svg/output.svg",
      "start": 28810714,
      "end": 28811856
    }, {
      "filename": "/5.3/datafiles/icons_svg/overlay.svg",
      "start": 28811856,
      "end": 28813575
    }, {
      "filename": "/5.3/datafiles/icons_svg/package.svg",
      "start": 28813575,
      "end": 28814543
    }, {
      "filename": "/5.3/datafiles/icons_svg/panel_close.svg",
      "start": 28814543,
      "end": 28815334
    }, {
      "filename": "/5.3/datafiles/icons_svg/particle_data.svg",
      "start": 28815334,
      "end": 28816620
    }, {
      "filename": "/5.3/datafiles/icons_svg/particle_path.svg",
      "start": 28816620,
      "end": 28817602
    }, {
      "filename": "/5.3/datafiles/icons_svg/particle_point.svg",
      "start": 28817602,
      "end": 28818988
    }, {
      "filename": "/5.3/datafiles/icons_svg/particle_tip.svg",
      "start": 28818988,
      "end": 28820334
    }, {
      "filename": "/5.3/datafiles/icons_svg/particlemode.svg",
      "start": 28820334,
      "end": 28821934
    }, {
      "filename": "/5.3/datafiles/icons_svg/particles.svg",
      "start": 28821934,
      "end": 28823220
    }, {
      "filename": "/5.3/datafiles/icons_svg/pastedown.svg",
      "start": 28823220,
      "end": 28824527
    }, {
      "filename": "/5.3/datafiles/icons_svg/pasteflipdown.svg",
      "start": 28824527,
      "end": 28826018
    }, {
      "filename": "/5.3/datafiles/icons_svg/pasteflipup.svg",
      "start": 28826018,
      "end": 28827525
    }, {
      "filename": "/5.3/datafiles/icons_svg/pause.svg",
      "start": 28827525,
      "end": 28828511
    }, {
      "filename": "/5.3/datafiles/icons_svg/physics.svg",
      "start": 28828511,
      "end": 28829671
    }, {
      "filename": "/5.3/datafiles/icons_svg/pinned.svg",
      "start": 28829671,
      "end": 28830718
    }, {
      "filename": "/5.3/datafiles/icons_svg/pivot_active.svg",
      "start": 28830718,
      "end": 28832018
    }, {
      "filename": "/5.3/datafiles/icons_svg/pivot_boundbox.svg",
      "start": 28832018,
      "end": 28833214
    }, {
      "filename": "/5.3/datafiles/icons_svg/pivot_cursor.svg",
      "start": 28833214,
      "end": 28834597
    }, {
      "filename": "/5.3/datafiles/icons_svg/pivot_individual.svg",
      "start": 28834597,
      "end": 28836079
    }, {
      "filename": "/5.3/datafiles/icons_svg/pivot_median.svg",
      "start": 28836079,
      "end": 28837583
    }, {
      "filename": "/5.3/datafiles/icons_svg/play.svg",
      "start": 28837583,
      "end": 28838341
    }, {
      "filename": "/5.3/datafiles/icons_svg/play_reverse.svg",
      "start": 28838341,
      "end": 28839095
    }, {
      "filename": "/5.3/datafiles/icons_svg/play_sound.svg",
      "start": 28839095,
      "end": 28840427
    }, {
      "filename": "/5.3/datafiles/icons_svg/playhead_snap_off.svg",
      "start": 28840427,
      "end": 28842647
    }, {
      "filename": "/5.3/datafiles/icons_svg/playhead_snap_on.svg",
      "start": 28842647,
      "end": 28845552
    }, {
      "filename": "/5.3/datafiles/icons_svg/plugin.svg",
      "start": 28845552,
      "end": 28846747
    }, {
      "filename": "/5.3/datafiles/icons_svg/plus.svg",
      "start": 28846747,
      "end": 28847926
    }, {
      "filename": "/5.3/datafiles/icons_svg/pmarker.svg",
      "start": 28847926,
      "end": 28848706
    }, {
      "filename": "/5.3/datafiles/icons_svg/pmarker_act.svg",
      "start": 28848706,
      "end": 28849451
    }, {
      "filename": "/5.3/datafiles/icons_svg/pmarker_sel.svg",
      "start": 28849451,
      "end": 28850196
    }, {
      "filename": "/5.3/datafiles/icons_svg/pointcloud_data.svg",
      "start": 28850196,
      "end": 28851234
    }, {
      "filename": "/5.3/datafiles/icons_svg/pointcloud_point.svg",
      "start": 28851234,
      "end": 28852325
    }, {
      "filename": "/5.3/datafiles/icons_svg/pose_hlt.svg",
      "start": 28852325,
      "end": 28853735
    }, {
      "filename": "/5.3/datafiles/icons_svg/preferences.svg",
      "start": 28853735,
      "end": 28854883
    }, {
      "filename": "/5.3/datafiles/icons_svg/preset.svg",
      "start": 28854883,
      "end": 28856501
    }, {
      "filename": "/5.3/datafiles/icons_svg/preset_new.svg",
      "start": 28856501,
      "end": 28857990
    }, {
      "filename": "/5.3/datafiles/icons_svg/prev_keyframe.svg",
      "start": 28857990,
      "end": 28859124
    }, {
      "filename": "/5.3/datafiles/icons_svg/preview_loading.svg",
      "start": 28859124,
      "end": 28860724
    }, {
      "filename": "/5.3/datafiles/icons_svg/preview_range.svg",
      "start": 28860724,
      "end": 28862234
    }, {
      "filename": "/5.3/datafiles/icons_svg/project.svg",
      "start": 28862234,
      "end": 28863761
    }, {
      "filename": "/5.3/datafiles/icons_svg/prop_con.svg",
      "start": 28863761,
      "end": 28865028
    }, {
      "filename": "/5.3/datafiles/icons_svg/prop_off.svg",
      "start": 28865028,
      "end": 28865843
    }, {
      "filename": "/5.3/datafiles/icons_svg/prop_on.svg",
      "start": 28865843,
      "end": 28867341
    }, {
      "filename": "/5.3/datafiles/icons_svg/prop_projected.svg",
      "start": 28867341,
      "end": 28868648
    }, {
      "filename": "/5.3/datafiles/icons_svg/properties.svg",
      "start": 28868648,
      "end": 28869621
    }, {
      "filename": "/5.3/datafiles/icons_svg/question.svg",
      "start": 28869621,
      "end": 28870879
    }, {
      "filename": "/5.3/datafiles/icons_svg/question_large.svg",
      "start": 28870879,
      "end": 28872875
    }, {
      "filename": "/5.3/datafiles/icons_svg/quit.svg",
      "start": 28872875,
      "end": 28873903
    }, {
      "filename": "/5.3/datafiles/icons_svg/radiobut_off.svg",
      "start": 28873903,
      "end": 28874796
    }, {
      "filename": "/5.3/datafiles/icons_svg/radiobut_on.svg",
      "start": 28874796,
      "end": 28875597
    }, {
      "filename": "/5.3/datafiles/icons_svg/rec.svg",
      "start": 28875597,
      "end": 28876183
    }, {
      "filename": "/5.3/datafiles/icons_svg/record_off.svg",
      "start": 28876183,
      "end": 28877076
    }, {
      "filename": "/5.3/datafiles/icons_svg/record_on.svg",
      "start": 28877076,
      "end": 28879551
    }, {
      "filename": "/5.3/datafiles/icons_svg/recover_last.svg",
      "start": 28879551,
      "end": 28880872
    }, {
      "filename": "/5.3/datafiles/icons_svg/remove.svg",
      "start": 28880872,
      "end": 28881399
    }, {
      "filename": "/5.3/datafiles/icons_svg/render_animation.svg",
      "start": 28881399,
      "end": 28882545
    }, {
      "filename": "/5.3/datafiles/icons_svg/render_result.svg",
      "start": 28882545,
      "end": 28883811
    }, {
      "filename": "/5.3/datafiles/icons_svg/render_still.svg",
      "start": 28883811,
      "end": 28884949
    }, {
      "filename": "/5.3/datafiles/icons_svg/render_swap_dimensions.svg",
      "start": 28884949,
      "end": 28888039
    }, {
      "filename": "/5.3/datafiles/icons_svg/renderlayers.svg",
      "start": 28888039,
      "end": 28889305
    }, {
      "filename": "/5.3/datafiles/icons_svg/restrict_color_off.svg",
      "start": 28889305,
      "end": 28890402
    }, {
      "filename": "/5.3/datafiles/icons_svg/restrict_color_on.svg",
      "start": 28890402,
      "end": 28891697
    }, {
      "filename": "/5.3/datafiles/icons_svg/restrict_instanced_off.svg",
      "start": 28891697,
      "end": 28893356
    }, {
      "filename": "/5.3/datafiles/icons_svg/restrict_instanced_on.svg",
      "start": 28893356,
      "end": 28894917
    }, {
      "filename": "/5.3/datafiles/icons_svg/restrict_render_off.svg",
      "start": 28894917,
      "end": 28896310
    }, {
      "filename": "/5.3/datafiles/icons_svg/restrict_render_on.svg",
      "start": 28896310,
      "end": 28897749
    }, {
      "filename": "/5.3/datafiles/icons_svg/restrict_select_off.svg",
      "start": 28897749,
      "end": 28898524
    }, {
      "filename": "/5.3/datafiles/icons_svg/restrict_select_on.svg",
      "start": 28898524,
      "end": 28899446
    }, {
      "filename": "/5.3/datafiles/icons_svg/restrict_view_off.svg",
      "start": 28899446,
      "end": 28900268
    }, {
      "filename": "/5.3/datafiles/icons_svg/restrict_view_on.svg",
      "start": 28900268,
      "end": 28901104
    }, {
      "filename": "/5.3/datafiles/icons_svg/rew.svg",
      "start": 28901104,
      "end": 28902166
    }, {
      "filename": "/5.3/datafiles/icons_svg/rightarrow.svg",
      "start": 28902166,
      "end": 28902855
    }, {
      "filename": "/5.3/datafiles/icons_svg/rightarrow_thin.svg",
      "start": 28902855,
      "end": 28903557
    }, {
      "filename": "/5.3/datafiles/icons_svg/rigid_body.svg",
      "start": 28903557,
      "end": 28904731
    }, {
      "filename": "/5.3/datafiles/icons_svg/rigid_body_constraint.svg",
      "start": 28904731,
      "end": 28906166
    }, {
      "filename": "/5.3/datafiles/icons_svg/rna.svg",
      "start": 28906166,
      "end": 28909049
    }, {
      "filename": "/5.3/datafiles/icons_svg/rndcurve.svg",
      "start": 28909049,
      "end": 28911252
    }, {
      "filename": "/5.3/datafiles/icons_svg/rootcurve.svg",
      "start": 28911252,
      "end": 28912244
    }, {
      "filename": "/5.3/datafiles/icons_svg/scene.svg",
      "start": 28912244,
      "end": 28913650
    }, {
      "filename": "/5.3/datafiles/icons_svg/scene_data.svg",
      "start": 28913650,
      "end": 28915157
    }, {
      "filename": "/5.3/datafiles/icons_svg/screen_back.svg",
      "start": 28915157,
      "end": 28916250
    }, {
      "filename": "/5.3/datafiles/icons_svg/script.svg",
      "start": 28916250,
      "end": 28918569
    }, {
      "filename": "/5.3/datafiles/icons_svg/scriptplugins.svg",
      "start": 28918569,
      "end": 28920893
    }, {
      "filename": "/5.3/datafiles/icons_svg/sculptmode_hlt.svg",
      "start": 28920893,
      "end": 28922207
    }, {
      "filename": "/5.3/datafiles/icons_svg/select_difference.svg",
      "start": 28922207,
      "end": 28923150
    }, {
      "filename": "/5.3/datafiles/icons_svg/select_extend.svg",
      "start": 28923150,
      "end": 28923910
    }, {
      "filename": "/5.3/datafiles/icons_svg/select_intersect.svg",
      "start": 28923910,
      "end": 28924880
    }, {
      "filename": "/5.3/datafiles/icons_svg/select_set.svg",
      "start": 28924880,
      "end": 28925580
    }, {
      "filename": "/5.3/datafiles/icons_svg/select_subtract.svg",
      "start": 28925580,
      "end": 28926438
    }, {
      "filename": "/5.3/datafiles/icons_svg/seq_chroma_scope.svg",
      "start": 28926438,
      "end": 28927443
    }, {
      "filename": "/5.3/datafiles/icons_svg/seq_histogram.svg",
      "start": 28927443,
      "end": 28928132
    }, {
      "filename": "/5.3/datafiles/icons_svg/seq_luma_waveform.svg",
      "start": 28928132,
      "end": 28928712
    }, {
      "filename": "/5.3/datafiles/icons_svg/seq_preview.svg",
      "start": 28928712,
      "end": 28929846
    }, {
      "filename": "/5.3/datafiles/icons_svg/seq_sequencer.svg",
      "start": 28929846,
      "end": 28930785
    }, {
      "filename": "/5.3/datafiles/icons_svg/seq_splitview.svg",
      "start": 28930785,
      "end": 28932108
    }, {
      "filename": "/5.3/datafiles/icons_svg/seq_strip_duplicate.svg",
      "start": 28932108,
      "end": 28932893
    }, {
      "filename": "/5.3/datafiles/icons_svg/seq_strip_meta.svg",
      "start": 28932893,
      "end": 28936202
    }, {
      "filename": "/5.3/datafiles/icons_svg/seq_strip_modifier.svg",
      "start": 28936202,
      "end": 28939049
    }, {
      "filename": "/5.3/datafiles/icons_svg/sequence.svg",
      "start": 28939049,
      "end": 28940291
    }, {
      "filename": "/5.3/datafiles/icons_svg/settings.svg",
      "start": 28940291,
      "end": 28943335
    }, {
      "filename": "/5.3/datafiles/icons_svg/shaderfx.svg",
      "start": 28943335,
      "end": 28944752
    }, {
      "filename": "/5.3/datafiles/icons_svg/shading_bbox.svg",
      "start": 28944752,
      "end": 28945730
    }, {
      "filename": "/5.3/datafiles/icons_svg/shading_rendered.svg",
      "start": 28945730,
      "end": 28947428
    }, {
      "filename": "/5.3/datafiles/icons_svg/shading_solid.svg",
      "start": 28947428,
      "end": 28948552
    }, {
      "filename": "/5.3/datafiles/icons_svg/shading_texture.svg",
      "start": 28948552,
      "end": 28950166
    }, {
      "filename": "/5.3/datafiles/icons_svg/shading_wire.svg",
      "start": 28950166,
      "end": 28951557
    }, {
      "filename": "/5.3/datafiles/icons_svg/shapekey_data.svg",
      "start": 28951557,
      "end": 28952724
    }, {
      "filename": "/5.3/datafiles/icons_svg/sharpcurve.svg",
      "start": 28952724,
      "end": 28953555
    }, {
      "filename": "/5.3/datafiles/icons_svg/shortdisplay.svg",
      "start": 28953555,
      "end": 28954660
    }, {
      "filename": "/5.3/datafiles/icons_svg/small_caps.svg",
      "start": 28954660,
      "end": 28955654
    }, {
      "filename": "/5.3/datafiles/icons_svg/smoothcurve.svg",
      "start": 28955654,
      "end": 28957021
    }, {
      "filename": "/5.3/datafiles/icons_svg/snap_edge.svg",
      "start": 28957021,
      "end": 28957806
    }, {
      "filename": "/5.3/datafiles/icons_svg/snap_face.svg",
      "start": 28957806,
      "end": 28958449
    }, {
      "filename": "/5.3/datafiles/icons_svg/snap_face_center.svg",
      "start": 28958449,
      "end": 28959315
    }, {
      "filename": "/5.3/datafiles/icons_svg/snap_face_nearest.svg",
      "start": 28959315,
      "end": 28960736
    }, {
      "filename": "/5.3/datafiles/icons_svg/snap_grid.svg",
      "start": 28960736,
      "end": 28961974
    }, {
      "filename": "/5.3/datafiles/icons_svg/snap_increment.svg",
      "start": 28961974,
      "end": 28962851
    }, {
      "filename": "/5.3/datafiles/icons_svg/snap_midpoint.svg",
      "start": 28962851,
      "end": 28963925
    }, {
      "filename": "/5.3/datafiles/icons_svg/snap_normal.svg",
      "start": 28963925,
      "end": 28965292
    }, {
      "filename": "/5.3/datafiles/icons_svg/snap_off.svg",
      "start": 28965292,
      "end": 28966721
    }, {
      "filename": "/5.3/datafiles/icons_svg/snap_on.svg",
      "start": 28966721,
      "end": 28968378
    }, {
      "filename": "/5.3/datafiles/icons_svg/snap_peel_object.svg",
      "start": 28968378,
      "end": 28969425
    }, {
      "filename": "/5.3/datafiles/icons_svg/snap_perpendicular.svg",
      "start": 28969425,
      "end": 28970588
    }, {
      "filename": "/5.3/datafiles/icons_svg/snap_vertex.svg",
      "start": 28970588,
      "end": 28971649
    }, {
      "filename": "/5.3/datafiles/icons_svg/snap_volume.svg",
      "start": 28971649,
      "end": 28972576
    }, {
      "filename": "/5.3/datafiles/icons_svg/solo_off.svg",
      "start": 28972576,
      "end": 28974229
    }, {
      "filename": "/5.3/datafiles/icons_svg/solo_on.svg",
      "start": 28974229,
      "end": 28975449
    }, {
      "filename": "/5.3/datafiles/icons_svg/sort_asc.svg",
      "start": 28975449,
      "end": 28976282
    }, {
      "filename": "/5.3/datafiles/icons_svg/sort_desc.svg",
      "start": 28976282,
      "end": 28977112
    }, {
      "filename": "/5.3/datafiles/icons_svg/sortalpha.svg",
      "start": 28977112,
      "end": 28978448
    }, {
      "filename": "/5.3/datafiles/icons_svg/sortbyext.svg",
      "start": 28978448,
      "end": 28979522
    }, {
      "filename": "/5.3/datafiles/icons_svg/sortsize.svg",
      "start": 28979522,
      "end": 28980285
    }, {
      "filename": "/5.3/datafiles/icons_svg/sorttime.svg",
      "start": 28980285,
      "end": 28981990
    }, {
      "filename": "/5.3/datafiles/icons_svg/sound.svg",
      "start": 28981990,
      "end": 28983062
    }, {
      "filename": "/5.3/datafiles/icons_svg/speaker.svg",
      "start": 28983062,
      "end": 28984568
    }, {
      "filename": "/5.3/datafiles/icons_svg/sphere.svg",
      "start": 28984568,
      "end": 28987178
    }, {
      "filename": "/5.3/datafiles/icons_svg/spherecurve.svg",
      "start": 28987178,
      "end": 28988196
    }, {
      "filename": "/5.3/datafiles/icons_svg/split_horizontal.svg",
      "start": 28988196,
      "end": 28988938
    }, {
      "filename": "/5.3/datafiles/icons_svg/split_vertical.svg",
      "start": 28988938,
      "end": 28989715
    }, {
      "filename": "/5.3/datafiles/icons_svg/spreadsheet.svg",
      "start": 28989715,
      "end": 28990495
    }, {
      "filename": "/5.3/datafiles/icons_svg/statusbar.svg",
      "start": 28990495,
      "end": 28991275
    }, {
      "filename": "/5.3/datafiles/icons_svg/sticky_uvs_disable.svg",
      "start": 28991275,
      "end": 28992155
    }, {
      "filename": "/5.3/datafiles/icons_svg/sticky_uvs_loc.svg",
      "start": 28992155,
      "end": 28995453
    }, {
      "filename": "/5.3/datafiles/icons_svg/sticky_uvs_vert.svg",
      "start": 28995453,
      "end": 28997904
    }, {
      "filename": "/5.3/datafiles/icons_svg/strands.svg",
      "start": 28997904,
      "end": 28999226
    }, {
      "filename": "/5.3/datafiles/icons_svg/stroke.svg",
      "start": 28999226,
      "end": 29000807
    }, {
      "filename": "/5.3/datafiles/icons_svg/stylus_pressure.svg",
      "start": 29000807,
      "end": 29002476
    }, {
      "filename": "/5.3/datafiles/icons_svg/surface_data.svg",
      "start": 29002476,
      "end": 29004062
    }, {
      "filename": "/5.3/datafiles/icons_svg/surface_ncircle.svg",
      "start": 29004062,
      "end": 29005261
    }, {
      "filename": "/5.3/datafiles/icons_svg/surface_ncurve.svg",
      "start": 29005261,
      "end": 29006557
    }, {
      "filename": "/5.3/datafiles/icons_svg/surface_ncylinder.svg",
      "start": 29006557,
      "end": 29008623
    }, {
      "filename": "/5.3/datafiles/icons_svg/surface_nsphere.svg",
      "start": 29008623,
      "end": 29010195
    }, {
      "filename": "/5.3/datafiles/icons_svg/surface_nsurface.svg",
      "start": 29010195,
      "end": 29011512
    }, {
      "filename": "/5.3/datafiles/icons_svg/surface_ntorus.svg",
      "start": 29011512,
      "end": 29013383
    }, {
      "filename": "/5.3/datafiles/icons_svg/syntax_off.svg",
      "start": 29013383,
      "end": 29014781
    }, {
      "filename": "/5.3/datafiles/icons_svg/syntax_on.svg",
      "start": 29014781,
      "end": 29015644
    }, {
      "filename": "/5.3/datafiles/icons_svg/system.svg",
      "start": 29015644,
      "end": 29018823
    }, {
      "filename": "/5.3/datafiles/icons_svg/tag.svg",
      "start": 29018823,
      "end": 29020070
    }, {
      "filename": "/5.3/datafiles/icons_svg/temp.svg",
      "start": 29020070,
      "end": 29021655
    }, {
      "filename": "/5.3/datafiles/icons_svg/text.svg",
      "start": 29021655,
      "end": 29022377
    }, {
      "filename": "/5.3/datafiles/icons_svg/texture.svg",
      "start": 29022377,
      "end": 29023165
    }, {
      "filename": "/5.3/datafiles/icons_svg/texture_data.svg",
      "start": 29023165,
      "end": 29023953
    }, {
      "filename": "/5.3/datafiles/icons_svg/three_dots.svg",
      "start": 29023953,
      "end": 29025047
    }, {
      "filename": "/5.3/datafiles/icons_svg/time.svg",
      "start": 29025047,
      "end": 29025994
    }, {
      "filename": "/5.3/datafiles/icons_svg/tool_settings.svg",
      "start": 29025994,
      "end": 29027272
    }, {
      "filename": "/5.3/datafiles/icons_svg/topbar.svg",
      "start": 29027272,
      "end": 29027984
    }, {
      "filename": "/5.3/datafiles/icons_svg/tpaint_hlt.svg",
      "start": 29027984,
      "end": 29028920
    }, {
      "filename": "/5.3/datafiles/icons_svg/tracker.svg",
      "start": 29028920,
      "end": 29029611
    }, {
      "filename": "/5.3/datafiles/icons_svg/tracker_data.svg",
      "start": 29029611,
      "end": 29030884
    }, {
      "filename": "/5.3/datafiles/icons_svg/tracking.svg",
      "start": 29030884,
      "end": 29032542
    }, {
      "filename": "/5.3/datafiles/icons_svg/tracking_backwards.svg",
      "start": 29032542,
      "end": 29033914
    }, {
      "filename": "/5.3/datafiles/icons_svg/tracking_backwards_single.svg",
      "start": 29033914,
      "end": 29035033
    }, {
      "filename": "/5.3/datafiles/icons_svg/tracking_clear_backwards.svg",
      "start": 29035033,
      "end": 29036386
    }, {
      "filename": "/5.3/datafiles/icons_svg/tracking_clear_forwards.svg",
      "start": 29036386,
      "end": 29037737
    }, {
      "filename": "/5.3/datafiles/icons_svg/tracking_forwards.svg",
      "start": 29037737,
      "end": 29039115
    }, {
      "filename": "/5.3/datafiles/icons_svg/tracking_forwards_single.svg",
      "start": 29039115,
      "end": 29040234
    }, {
      "filename": "/5.3/datafiles/icons_svg/tracking_refine_backwards.svg",
      "start": 29040234,
      "end": 29041683
    }, {
      "filename": "/5.3/datafiles/icons_svg/tracking_refine_forwards.svg",
      "start": 29041683,
      "end": 29043146
    }, {
      "filename": "/5.3/datafiles/icons_svg/transform_origins.svg",
      "start": 29043146,
      "end": 29044299
    }, {
      "filename": "/5.3/datafiles/icons_svg/trash.svg",
      "start": 29044299,
      "end": 29045560
    }, {
      "filename": "/5.3/datafiles/icons_svg/tria_down.svg",
      "start": 29045560,
      "end": 29046481
    }, {
      "filename": "/5.3/datafiles/icons_svg/tria_down_bar.svg",
      "start": 29046481,
      "end": 29047177
    }, {
      "filename": "/5.3/datafiles/icons_svg/tria_left.svg",
      "start": 29047177,
      "end": 29048101
    }, {
      "filename": "/5.3/datafiles/icons_svg/tria_left_bar.svg",
      "start": 29048101,
      "end": 29048812
    }, {
      "filename": "/5.3/datafiles/icons_svg/tria_right.svg",
      "start": 29048812,
      "end": 29049731
    }, {
      "filename": "/5.3/datafiles/icons_svg/tria_right_bar.svg",
      "start": 29049731,
      "end": 29050442
    }, {
      "filename": "/5.3/datafiles/icons_svg/tria_up.svg",
      "start": 29050442,
      "end": 29051356
    }, {
      "filename": "/5.3/datafiles/icons_svg/tria_up_bar.svg",
      "start": 29051356,
      "end": 29052057
    }, {
      "filename": "/5.3/datafiles/icons_svg/uglypackage.svg",
      "start": 29052057,
      "end": 29053322
    }, {
      "filename": "/5.3/datafiles/icons_svg/underline.svg",
      "start": 29053322,
      "end": 29054275
    }, {
      "filename": "/5.3/datafiles/icons_svg/unlinked.svg",
      "start": 29054275,
      "end": 29056824
    }, {
      "filename": "/5.3/datafiles/icons_svg/unlocked.svg",
      "start": 29056824,
      "end": 29058164
    }, {
      "filename": "/5.3/datafiles/icons_svg/unpinned.svg",
      "start": 29058164,
      "end": 29059396
    }, {
      "filename": "/5.3/datafiles/icons_svg/url.svg",
      "start": 29059396,
      "end": 29062262
    }, {
      "filename": "/5.3/datafiles/icons_svg/usb_drive.svg",
      "start": 29062262,
      "end": 29063461
    }, {
      "filename": "/5.3/datafiles/icons_svg/usb_drive_large.svg",
      "start": 29063461,
      "end": 29065817
    }, {
      "filename": "/5.3/datafiles/icons_svg/user.svg",
      "start": 29065817,
      "end": 29067711
    }, {
      "filename": "/5.3/datafiles/icons_svg/uv.svg",
      "start": 29067711,
      "end": 29068838
    }, {
      "filename": "/5.3/datafiles/icons_svg/uv_data.svg",
      "start": 29068838,
      "end": 29069718
    }, {
      "filename": "/5.3/datafiles/icons_svg/uv_edgesel.svg",
      "start": 29069718,
      "end": 29070748
    }, {
      "filename": "/5.3/datafiles/icons_svg/uv_facesel.svg",
      "start": 29070748,
      "end": 29071776
    }, {
      "filename": "/5.3/datafiles/icons_svg/uv_islandsel.svg",
      "start": 29071776,
      "end": 29072717
    }, {
      "filename": "/5.3/datafiles/icons_svg/uv_sync_select.svg",
      "start": 29072717,
      "end": 29073857
    }, {
      "filename": "/5.3/datafiles/icons_svg/uv_vertexsel.svg",
      "start": 29073857,
      "end": 29074881
    }, {
      "filename": "/5.3/datafiles/icons_svg/vertex_crease.svg",
      "start": 29074881,
      "end": 29076087
    }, {
      "filename": "/5.3/datafiles/icons_svg/vertexsel.svg",
      "start": 29076087,
      "end": 29077230
    }, {
      "filename": "/5.3/datafiles/icons_svg/view3d.svg",
      "start": 29077230,
      "end": 29078725
    }, {
      "filename": "/5.3/datafiles/icons_svg/view_camera.svg",
      "start": 29078725,
      "end": 29080227
    }, {
      "filename": "/5.3/datafiles/icons_svg/view_camera_unselected.svg",
      "start": 29080227,
      "end": 29082172
    }, {
      "filename": "/5.3/datafiles/icons_svg/view_locked.svg",
      "start": 29082172,
      "end": 29083050
    }, {
      "filename": "/5.3/datafiles/icons_svg/view_ortho.svg",
      "start": 29083050,
      "end": 29083851
    }, {
      "filename": "/5.3/datafiles/icons_svg/view_pan.svg",
      "start": 29083851,
      "end": 29085077
    }, {
      "filename": "/5.3/datafiles/icons_svg/view_perspective.svg",
      "start": 29085077,
      "end": 29086079
    }, {
      "filename": "/5.3/datafiles/icons_svg/view_unlocked.svg",
      "start": 29086079,
      "end": 29087141
    }, {
      "filename": "/5.3/datafiles/icons_svg/view_zoom.svg",
      "start": 29087141,
      "end": 29088663
    }, {
      "filename": "/5.3/datafiles/icons_svg/viewzoom.svg",
      "start": 29088663,
      "end": 29089503
    }, {
      "filename": "/5.3/datafiles/icons_svg/vis_sel_00.svg",
      "start": 29089503,
      "end": 29090692
    }, {
      "filename": "/5.3/datafiles/icons_svg/vis_sel_01.svg",
      "start": 29090692,
      "end": 29091962
    }, {
      "filename": "/5.3/datafiles/icons_svg/vis_sel_10.svg",
      "start": 29091962,
      "end": 29093524
    }, {
      "filename": "/5.3/datafiles/icons_svg/vis_sel_11.svg",
      "start": 29093524,
      "end": 29094813
    }, {
      "filename": "/5.3/datafiles/icons_svg/volume_data.svg",
      "start": 29094813,
      "end": 29097093
    }, {
      "filename": "/5.3/datafiles/icons_svg/vpaint_hlt.svg",
      "start": 29097093,
      "end": 29098200
    }, {
      "filename": "/5.3/datafiles/icons_svg/warning_large.svg",
      "start": 29098200,
      "end": 29100160
    }, {
      "filename": "/5.3/datafiles/icons_svg/window.svg",
      "start": 29100160,
      "end": 29100950
    }, {
      "filename": "/5.3/datafiles/icons_svg/wordwrap_off.svg",
      "start": 29100950,
      "end": 29101791
    }, {
      "filename": "/5.3/datafiles/icons_svg/wordwrap_on.svg",
      "start": 29101791,
      "end": 29102790
    }, {
      "filename": "/5.3/datafiles/icons_svg/workspace.svg",
      "start": 29102790,
      "end": 29103733
    }, {
      "filename": "/5.3/datafiles/icons_svg/world.svg",
      "start": 29103733,
      "end": 29104995
    }, {
      "filename": "/5.3/datafiles/icons_svg/world_data.svg",
      "start": 29104995,
      "end": 29106257
    }, {
      "filename": "/5.3/datafiles/icons_svg/wpaint_hlt.svg",
      "start": 29106257,
      "end": 29107081
    }, {
      "filename": "/5.3/datafiles/icons_svg/x.svg",
      "start": 29107081,
      "end": 29108104
    }, {
      "filename": "/5.3/datafiles/icons_svg/xray.svg",
      "start": 29108104,
      "end": 29109006
    }, {
      "filename": "/5.3/datafiles/icons_svg/zoom_all.svg",
      "start": 29109006,
      "end": 29110655
    }, {
      "filename": "/5.3/datafiles/icons_svg/zoom_in.svg",
      "start": 29110655,
      "end": 29111894
    }, {
      "filename": "/5.3/datafiles/icons_svg/zoom_out.svg",
      "start": 29111894,
      "end": 29113049
    }, {
      "filename": "/5.3/datafiles/icons_svg/zoom_previous.svg",
      "start": 29113049,
      "end": 29114493
    }, {
      "filename": "/5.3/datafiles/icons_svg/zoom_selected.svg",
      "start": 29114493,
      "end": 29116162
    }, {
      "filename": "/5.3/datafiles/preview.blend",
      "start": 29116162,
      "end": 30528620
    }, {
      "filename": "/5.3/datafiles/preview_grease_pencil.blend",
      "start": 30528620,
      "end": 31654939
    }, {
      "filename": "/5.3/datafiles/splash.png",
      "start": 31654939,
      "end": 32380683
    }, {
      "filename": "/5.3/datafiles/startup.blend",
      "start": 32380683,
      "end": 32502067
    }, {
      "filename": "/5.3/datafiles/studiolights/matcap/basic_bright.exr",
      "start": 32502067,
      "end": 32556315
    }, {
      "filename": "/5.3/datafiles/studiolights/matcap/basic_dark.exr",
      "start": 32556315,
      "end": 32593211
    }, {
      "filename": "/5.3/datafiles/studiolights/matcap/basic_grey.exr",
      "start": 32593211,
      "end": 32641012
    }, {
      "filename": "/5.3/datafiles/studiolights/matcap/basic_side.exr",
      "start": 32641012,
      "end": 32691539
    }, {
      "filename": "/5.3/datafiles/studiolights/matcap/brush_thumbnail_preview.exr",
      "start": 32691539,
      "end": 32740996
    }, {
      "filename": "/5.3/datafiles/studiolights/matcap/ceramic_dark.exr",
      "start": 32740996,
      "end": 32814871
    }, {
      "filename": "/5.3/datafiles/studiolights/matcap/ceramic_lightbulb.exr",
      "start": 32814871,
      "end": 32889371
    }, {
      "filename": "/5.3/datafiles/studiolights/matcap/check_gradient.exr",
      "start": 32889371,
      "end": 32966966
    }, {
      "filename": "/5.3/datafiles/studiolights/matcap/check_normal+y.exr",
      "start": 32966966,
      "end": 33054443
    }, {
      "filename": "/5.3/datafiles/studiolights/matcap/check_reflection_horizontal.exr",
      "start": 33054443,
      "end": 33341784
    }, {
      "filename": "/5.3/datafiles/studiolights/matcap/check_reflection_vertical.exr",
      "start": 33341784,
      "end": 33514315
    }, {
      "filename": "/5.3/datafiles/studiolights/matcap/check_rim_dark.exr",
      "start": 33514315,
      "end": 33568385
    }, {
      "filename": "/5.3/datafiles/studiolights/matcap/check_rim_light.exr",
      "start": 33568385,
      "end": 33634067
    }, {
      "filename": "/5.3/datafiles/studiolights/matcap/clay_brown.exr",
      "start": 33634067,
      "end": 33691879
    }, {
      "filename": "/5.3/datafiles/studiolights/matcap/clay_green.exr",
      "start": 33691879,
      "end": 33742796
    }, {
      "filename": "/5.3/datafiles/studiolights/matcap/clay_studio.exr",
      "start": 33742796,
      "end": 33806587
    }, {
      "filename": "/5.3/datafiles/studiolights/matcap/clay_warm.exr",
      "start": 33806587,
      "end": 33865570
    }, {
      "filename": "/5.3/datafiles/studiolights/matcap/fullmetal.exr",
      "start": 33865570,
      "end": 33986778
    }, {
      "filename": "/5.3/datafiles/studiolights/matcap/hard_surface_grey.exr",
      "start": 33986778,
      "end": 34045662
    }, {
      "filename": "/5.3/datafiles/studiolights/matcap/hard_surface_red.exr",
      "start": 34045662,
      "end": 34148534
    }, {
      "filename": "/5.3/datafiles/studiolights/matcap/license.txt",
      "start": 34148534,
      "end": 34148657
    }, {
      "filename": "/5.3/datafiles/studiolights/matcap/metal_bronze.exr",
      "start": 34148657,
      "end": 34188382
    }, {
      "filename": "/5.3/datafiles/studiolights/matcap/metal_carpaint.exr",
      "start": 34188382,
      "end": 34278524
    }, {
      "filename": "/5.3/datafiles/studiolights/matcap/pearl.exr",
      "start": 34278524,
      "end": 34350731
    }, {
      "filename": "/5.3/datafiles/studiolights/matcap/red_wax.exr",
      "start": 34350731,
      "end": 34495374
    }, {
      "filename": "/5.3/datafiles/studiolights/matcap/resin.exr",
      "start": 34495374,
      "end": 34576729
    }, {
      "filename": "/5.3/datafiles/studiolights/matcap/toon_dark.exr",
      "start": 34576729,
      "end": 34634321
    }, {
      "filename": "/5.3/datafiles/studiolights/matcap/toon_light.exr",
      "start": 34634321,
      "end": 34669365
    }, {
      "filename": "/5.3/datafiles/studiolights/studio/basic.sl",
      "start": 34669365,
      "end": 34670493
    }, {
      "filename": "/5.3/datafiles/studiolights/studio/outdoor.sl",
      "start": 34670493,
      "end": 34671620
    }, {
      "filename": "/5.3/datafiles/studiolights/studio/paint.sl",
      "start": 34671620,
      "end": 34672750
    }, {
      "filename": "/5.3/datafiles/studiolights/studio/rim.sl",
      "start": 34672750,
      "end": 34673879
    }, {
      "filename": "/5.3/datafiles/studiolights/studio/studio.sl",
      "start": 34673879,
      "end": 34675008
    }, {
      "filename": "/5.3/datafiles/studiolights/world/city.exr",
      "start": 34675008,
      "end": 34879871
    }, {
      "filename": "/5.3/datafiles/studiolights/world/courtyard.exr",
      "start": 34879871,
      "end": 35134997
    }, {
      "filename": "/5.3/datafiles/studiolights/world/forest.exr",
      "start": 35134997,
      "end": 35687638
    }, {
      "filename": "/5.3/datafiles/studiolights/world/interior.exr",
      "start": 35687638,
      "end": 35877054
    }, {
      "filename": "/5.3/datafiles/studiolights/world/license.txt",
      "start": 35877054,
      "end": 35877761
    }, {
      "filename": "/5.3/datafiles/studiolights/world/night.exr",
      "start": 35877761,
      "end": 36017720
    }, {
      "filename": "/5.3/datafiles/studiolights/world/studio.exr",
      "start": 36017720,
      "end": 36115735
    }, {
      "filename": "/5.3/datafiles/studiolights/world/sunrise.exr",
      "start": 36115735,
      "end": 36367612
    }, {
      "filename": "/5.3/datafiles/studiolights/world/sunset.exr",
      "start": 36367612,
      "end": 36538776
    }, {
      "filename": "/5.3/datafiles/userdef/userdef_default_theme.c",
      "start": 36538776,
      "end": 36567276
    }, {
      "filename": "/5.3/scripts/addons_core/bl_pkg/Makefile",
      "start": 36567276,
      "end": 36572812
    }, {
      "filename": "/5.3/scripts/addons_core/bl_pkg/__init__.py",
      "start": 36572812,
      "end": 36607392
    }, {
      "filename": "/5.3/scripts/addons_core/bl_pkg/bl_extension_cli.py",
      "start": 36607392,
      "end": 36636582
    }, {
      "filename": "/5.3/scripts/addons_core/bl_pkg/bl_extension_notify.py",
      "start": 36636582,
      "end": 36660074
    }, {
      "filename": "/5.3/scripts/addons_core/bl_pkg/bl_extension_ops.py",
      "start": 36660074,
      "end": 36810614
    }, {
      "filename": "/5.3/scripts/addons_core/bl_pkg/bl_extension_ui.py",
      "start": 36810614,
      "end": 36902035
    }, {
      "filename": "/5.3/scripts/addons_core/bl_pkg/bl_extension_utils.py",
      "start": 36902035,
      "end": 36983862
    }, {
      "filename": "/5.3/scripts/addons_core/bl_pkg/cli/blender_ext.py",
      "start": 36983862,
      "end": 37194486
    }, {
      "filename": "/5.3/scripts/addons_core/bl_pkg/example_extension/AUTHORS",
      "start": 37194486,
      "end": 37194570
    }, {
      "filename": "/5.3/scripts/addons_core/bl_pkg/example_extension/__init__.py",
      "start": 37194570,
      "end": 37194775
    }, {
      "filename": "/5.3/scripts/addons_core/bl_pkg/example_extension/blender_manifest.toml",
      "start": 37194775,
      "end": 37195450
    }, {
      "filename": "/5.3/scripts/addons_core/bl_pkg/extensions_map_from_legacy_addons.py",
      "start": 37195450,
      "end": 37201858
    }, {
      "filename": "/5.3/scripts/addons_core/bl_pkg/readme.rst",
      "start": 37201858,
      "end": 37214754
    }, {
      "filename": "/5.3/scripts/addons_core/bl_pkg/tests/modules/http_server_context.py",
      "start": 37214754,
      "end": 37217855
    }, {
      "filename": "/5.3/scripts/addons_core/bl_pkg/tests/modules/python_wheel_generate.py",
      "start": 37217855,
      "end": 37221657
    }, {
      "filename": "/5.3/scripts/addons_core/bl_pkg/tests/test_blender.py",
      "start": 37221657,
      "end": 37227314
    }, {
      "filename": "/5.3/scripts/addons_core/bl_pkg/tests/test_cli.py",
      "start": 37227314,
      "end": 37256844
    }, {
      "filename": "/5.3/scripts/addons_core/bl_pkg/tests/test_cli_blender.py",
      "start": 37256844,
      "end": 37311e3
    }, {
      "filename": "/5.3/scripts/addons_core/bl_pkg/tests/test_path_pattern_match.py",
      "start": 37311e3,
      "end": 37318782
    }, {
      "filename": "/5.3/scripts/addons_core/hydra_storm/__init__.py",
      "start": 37318782,
      "end": 37319463
    }, {
      "filename": "/5.3/scripts/addons_core/hydra_storm/engine.py",
      "start": 37319463,
      "end": 37321066
    }, {
      "filename": "/5.3/scripts/addons_core/hydra_storm/properties.py",
      "start": 37321066,
      "end": 37322887
    }, {
      "filename": "/5.3/scripts/addons_core/hydra_storm/ui.py",
      "start": 37322887,
      "end": 37330758
    }, {
      "filename": "/5.3/scripts/addons_core/io_anim_bvh/__init__.py",
      "start": 37330758,
      "end": 37342572
    }, {
      "filename": "/5.3/scripts/addons_core/io_anim_bvh/export_bvh.py",
      "start": 37342572,
      "end": 37352467
    }, {
      "filename": "/5.3/scripts/addons_core/io_anim_bvh/import_bvh.py",
      "start": 37352467,
      "end": 37381804
    }, {
      "filename": "/5.3/scripts/addons_core/io_curve_svg/__init__.py",
      "start": 37381804,
      "end": 37384791
    }, {
      "filename": "/5.3/scripts/addons_core/io_curve_svg/import_svg.py",
      "start": 37384791,
      "end": 37436485
    }, {
      "filename": "/5.3/scripts/addons_core/io_curve_svg/svg_colors.py",
      "start": 37436485,
      "end": 37442806
    }, {
      "filename": "/5.3/scripts/addons_core/io_curve_svg/svg_util.py",
      "start": 37442806,
      "end": 37445766
    }, {
      "filename": "/5.3/scripts/addons_core/io_curve_svg/svg_util_test.py",
      "start": 37445766,
      "end": 37451540
    }, {
      "filename": "/5.3/scripts/addons_core/io_mesh_uv_layout/__init__.py",
      "start": 37451540,
      "end": 37461674
    }, {
      "filename": "/5.3/scripts/addons_core/io_mesh_uv_layout/export_uv_eps.py",
      "start": 37461674,
      "end": 37464152
    }, {
      "filename": "/5.3/scripts/addons_core/io_mesh_uv_layout/export_uv_png.py",
      "start": 37464152,
      "end": 37468077
    }, {
      "filename": "/5.3/scripts/addons_core/io_mesh_uv_layout/export_uv_svg.py",
      "start": 37468077,
      "end": 37469808
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_fbx/__init__.py",
      "start": 37469808,
      "end": 37497408
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_fbx/data_types.py",
      "start": 37497408,
      "end": 37499072
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_fbx/encode_bin.py",
      "start": 37499072,
      "end": 37513824
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_fbx/export_fbx_bin.py",
      "start": 37513824,
      "end": 37703141
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_fbx/fbx2json.py",
      "start": 37703141,
      "end": 37712828
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_fbx/fbx_utils.py",
      "start": 37712828,
      "end": 37801842
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_fbx/fbx_utils_threading.py",
      "start": 37801842,
      "end": 37813427
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_fbx/import_fbx.py",
      "start": 37813427,
      "end": 38002340
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_fbx/json2fbx.py",
      "start": 38002340,
      "end": 38005967
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_fbx/parse_fbx.py",
      "start": 38005967,
      "end": 38017102
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/__init__.py",
      "start": 38017102,
      "end": 38103707
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/__init__.py",
      "start": 38103707,
      "end": 38103811
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/com/blender_default.py",
      "start": 38103811,
      "end": 38104122
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/com/conversion.py",
      "start": 38104122,
      "end": 38112056
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/com/data_path.py",
      "start": 38112056,
      "end": 38115330
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/com/extras.py",
      "start": 38115330,
      "end": 38119631
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/com/gltf2_blender_math.py",
      "start": 38119631,
      "end": 38126398
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/com/gltf2_blender_ui.py",
      "start": 38126398,
      "end": 38161287
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/com/gltf2_blender_utils.py",
      "start": 38161287,
      "end": 38165439
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/com/json_util.py",
      "start": 38165439,
      "end": 38166106
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/com/material_helpers.py",
      "start": 38166106,
      "end": 38167692
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/accessors.py",
      "start": 38167692,
      "end": 38176421
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/animation/action.py",
      "start": 38176421,
      "end": 38257034
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/animation/anim_extra_utils.py",
      "start": 38257034,
      "end": 38264746
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/animation/anim_utils.py",
      "start": 38264746,
      "end": 38278680
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/animation/animations.py",
      "start": 38278680,
      "end": 38279457
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/animation/drivers.py",
      "start": 38279457,
      "end": 38282758
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/animation/fcurves/animation.py",
      "start": 38282758,
      "end": 38285725
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/animation/fcurves/channel_target.py",
      "start": 38285725,
      "end": 38289615
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/animation/fcurves/channels.py",
      "start": 38289615,
      "end": 38329424
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/animation/fcurves/keyframes.py",
      "start": 38329424,
      "end": 38338728
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/animation/fcurves/sampler.py",
      "start": 38338728,
      "end": 38352405
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/animation/keyframes.py",
      "start": 38352405,
      "end": 38357409
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/animation/sampled/armature/action_sampled.py",
      "start": 38357409,
      "end": 38360092
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/animation/sampled/armature/channel_target.py",
      "start": 38360092,
      "end": 38361787
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/animation/sampled/armature/channels.py",
      "start": 38361787,
      "end": 38373039
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/animation/sampled/armature/keyframes.py",
      "start": 38373039,
      "end": 38376416
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/animation/sampled/armature/sampler.py",
      "start": 38376416,
      "end": 38387659
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/animation/sampled/data/action_sampled.py",
      "start": 38387659,
      "end": 38391650
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/animation/sampled/data/channel_target.py",
      "start": 38391650,
      "end": 38393862
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/animation/sampled/data/channels.py",
      "start": 38393862,
      "end": 38402516
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/animation/sampled/data/keyframes.py",
      "start": 38402516,
      "end": 38411662
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/animation/sampled/data/sampler.py",
      "start": 38411662,
      "end": 38416963
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/animation/sampled/object/action_sampled.py",
      "start": 38416963,
      "end": 38419234
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/animation/sampled/object/channel_target.py",
      "start": 38419234,
      "end": 38420725
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/animation/sampled/object/channels.py",
      "start": 38420725,
      "end": 38427065
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/animation/sampled/object/keyframes.py",
      "start": 38427065,
      "end": 38430038
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/animation/sampled/object/sampler.py",
      "start": 38430038,
      "end": 38438158
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/animation/sampled/sampling_cache.py",
      "start": 38438158,
      "end": 38484783
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/animation/sampled/shapekeys/action_sampled.py",
      "start": 38484783,
      "end": 38486263
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/animation/sampled/shapekeys/channel_target.py",
      "start": 38486263,
      "end": 38487372
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/animation/sampled/shapekeys/channels.py",
      "start": 38487372,
      "end": 38489738
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/animation/sampled/shapekeys/keyframes.py",
      "start": 38489738,
      "end": 38495540
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/animation/sampled/shapekeys/sampler.py",
      "start": 38495540,
      "end": 38500670
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/animation/scene_animation.py",
      "start": 38500670,
      "end": 38513411
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/animation/tracks.py",
      "start": 38513411,
      "end": 38549454
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/attribute_utils.py",
      "start": 38549454,
      "end": 38551535
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/cache.py",
      "start": 38551535,
      "end": 38558868
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/cameras.py",
      "start": 38558868,
      "end": 38564133
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/export.py",
      "start": 38564133,
      "end": 38590109
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/exporter.py",
      "start": 38590109,
      "end": 38617988
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/gather.py",
      "start": 38617988,
      "end": 38626201
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/joints.py",
      "start": 38626201,
      "end": 38630951
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/light_spots.py",
      "start": 38630951,
      "end": 38632409
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/lights.py",
      "start": 38632409,
      "end": 38642345
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/material/encode_image.py",
      "start": 38642345,
      "end": 38661507
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/material/extensions/anisotropy.py",
      "start": 38661507,
      "end": 38673661
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/material/extensions/clearcoat.py",
      "start": 38673661,
      "end": 38684018
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/material/extensions/dispersion.py",
      "start": 38684018,
      "end": 38685400
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/material/extensions/emission.py",
      "start": 38685400,
      "end": 38690626
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/material/extensions/ior.py",
      "start": 38690626,
      "end": 38692097
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/material/extensions/iridescence.py",
      "start": 38692097,
      "end": 38703759
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/material/extensions/sheen.py",
      "start": 38703759,
      "end": 38710945
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/material/extensions/specular.py",
      "start": 38710945,
      "end": 38718308
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/material/extensions/transmission.py",
      "start": 38718308,
      "end": 38721991
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/material/extensions/variants.py",
      "start": 38721991,
      "end": 38722507
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/material/extensions/volume.py",
      "start": 38722507,
      "end": 38728057
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/material/image.py",
      "start": 38728057,
      "end": 38749433
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/material/material_utils.py",
      "start": 38749433,
      "end": 38749857
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/material/material_viewport.py",
      "start": 38749857,
      "end": 38751154
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/material/materials.py",
      "start": 38751154,
      "end": 38795909
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/material/pbr_metallic_roughness.py",
      "start": 38795909,
      "end": 38806918
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/material/search_node_tree.py",
      "start": 38806918,
      "end": 38851844
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/material/texture.py",
      "start": 38851844,
      "end": 38861380
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/material/texture_info.py",
      "start": 38861380,
      "end": 38872614
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/material/unlit.py",
      "start": 38872614,
      "end": 38878247
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/nodes.py",
      "start": 38878247,
      "end": 38905472
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/obj_data.py",
      "start": 38905472,
      "end": 38912241
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/pointcloud.py",
      "start": 38912241,
      "end": 38915646
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/primitive_attributes.py",
      "start": 38915646,
      "end": 38925796
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/primitive_extract.py",
      "start": 38925796,
      "end": 39012481
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/primitives.py",
      "start": 39012481,
      "end": 39029336
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/sampler.py",
      "start": 39029336,
      "end": 39036260
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/skins.py",
      "start": 39036260,
      "end": 39041672
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/exp/tree.py",
      "start": 39041672,
      "end": 39091935
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/imp/KHR_materials_anisotropy.py",
      "start": 39091935,
      "end": 39097248
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/imp/KHR_materials_iridescence.py",
      "start": 39097248,
      "end": 39104638
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/imp/KHR_materials_pbrSpecularGlossiness.py",
      "start": 39104638,
      "end": 39111094
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/imp/KHR_materials_unlit.py",
      "start": 39111094,
      "end": 39113451
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/imp/animation.py",
      "start": 39113451,
      "end": 39126658
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/imp/animation_node.py",
      "start": 39126658,
      "end": 39133358
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/imp/animation_pointer.py",
      "start": 39133358,
      "end": 39173574
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/imp/animation_utils.py",
      "start": 39173574,
      "end": 39180373
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/imp/animation_weight.py",
      "start": 39180373,
      "end": 39183990
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/imp/blender_gltf.py",
      "start": 39183990,
      "end": 39223629
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/imp/camera.py",
      "start": 39223629,
      "end": 39226861
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/imp/draco_compression_extension.py",
      "start": 39226861,
      "end": 39232459
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/imp/image.py",
      "start": 39232459,
      "end": 39235524
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/imp/light.py",
      "start": 39235524,
      "end": 39241578
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/imp/material.py",
      "start": 39241578,
      "end": 39246557
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/imp/material_utils.py",
      "start": 39246557,
      "end": 39252285
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/imp/mesh.py",
      "start": 39252285,
      "end": 39295759
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/imp/node.py",
      "start": 39295759,
      "end": 39311390
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/imp/pbrMetallicRoughness.py",
      "start": 39311390,
      "end": 39360160
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/imp/scene.py",
      "start": 39360160,
      "end": 39365607
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/imp/texture.py",
      "start": 39365607,
      "end": 39375294
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/blender/imp/vnode.py",
      "start": 39375294,
      "end": 39399368
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/io/__init__.py",
      "start": 39399368,
      "end": 39399492
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/io/com/constants.py",
      "start": 39399492,
      "end": 39403704
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/io/com/debug.py",
      "start": 39403704,
      "end": 39407487
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/io/com/gltf2_io.py",
      "start": 39407487,
      "end": 39462638
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/io/com/gltf2_io_extensions.py",
      "start": 39462638,
      "end": 39463906
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/io/com/library.py",
      "start": 39463906,
      "end": 39465543
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/io/com/lights_punctual.py",
      "start": 39465543,
      "end": 39468504
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/io/com/path.py",
      "start": 39468504,
      "end": 39468954
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/io/com/variants.py",
      "start": 39468954,
      "end": 39470082
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/io/exp/binary_data.py",
      "start": 39470082,
      "end": 39471366
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/io/exp/buffer.py",
      "start": 39471366,
      "end": 39476691
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/io/exp/draco.py",
      "start": 39476691,
      "end": 39483095
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/io/exp/export.py",
      "start": 39483095,
      "end": 39486380
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/io/exp/image_data.py",
      "start": 39486380,
      "end": 39488391
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/io/exp/meshopt.py",
      "start": 39488391,
      "end": 39497110
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/io/exp/user_extensions.py",
      "start": 39497110,
      "end": 39498321
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/io/imp/__init__.py",
      "start": 39498321,
      "end": 39498448
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/io/imp/gltf2_io_binary.py",
      "start": 39498448,
      "end": 39507429
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/io/imp/gltf2_io_binary_meshopt.py",
      "start": 39507429,
      "end": 39512101
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/io/imp/gltf2_io_gltf.py",
      "start": 39512101,
      "end": 39519858
    }, {
      "filename": "/5.3/scripts/addons_core/io_scene_gltf2/io/imp/user_extensions.py",
      "start": 39519858,
      "end": 39520973
    }, {
      "filename": "/5.3/scripts/addons_core/node_wrangler/README.md",
      "start": 39520973,
      "end": 39521020
    }, {
      "filename": "/5.3/scripts/addons_core/node_wrangler/__init__.py",
      "start": 39521020,
      "end": 39523034
    }, {
      "filename": "/5.3/scripts/addons_core/node_wrangler/interface.py",
      "start": 39523034,
      "end": 39539599
    }, {
      "filename": "/5.3/scripts/addons_core/node_wrangler/operators/__init__.py",
      "start": 39539599,
      "end": 39541584
    }, {
      "filename": "/5.3/scripts/addons_core/node_wrangler/operators/add_image_sequence.py",
      "start": 39541584,
      "end": 39546760
    }, {
      "filename": "/5.3/scripts/addons_core/node_wrangler/operators/add_principled_setup.py",
      "start": 39546760,
      "end": 39560152
    }, {
      "filename": "/5.3/scripts/addons_core/node_wrangler/operators/add_reroutes.py",
      "start": 39560152,
      "end": 39564401
    }, {
      "filename": "/5.3/scripts/addons_core/node_wrangler/operators/add_texture_setup.py",
      "start": 39564401,
      "end": 39568361
    }, {
      "filename": "/5.3/scripts/addons_core/node_wrangler/operators/align_selected.py",
      "start": 39568361,
      "end": 39572529
    }, {
      "filename": "/5.3/scripts/addons_core/node_wrangler/operators/batch_change.py",
      "start": 39572529,
      "end": 39576171
    }, {
      "filename": "/5.3/scripts/addons_core/node_wrangler/operators/center_selected.py",
      "start": 39576171,
      "end": 39578048
    }, {
      "filename": "/5.3/scripts/addons_core/node_wrangler/operators/change_factor.py",
      "start": 39578048,
      "end": 39579530
    }, {
      "filename": "/5.3/scripts/addons_core/node_wrangler/operators/copy_label.py",
      "start": 39579530,
      "end": 39581689
    }, {
      "filename": "/5.3/scripts/addons_core/node_wrangler/operators/copy_settings.py",
      "start": 39581689,
      "end": 39585875
    }, {
      "filename": "/5.3/scripts/addons_core/node_wrangler/operators/delete_unused.py",
      "start": 39585875,
      "end": 39590524
    }, {
      "filename": "/5.3/scripts/addons_core/node_wrangler/operators/detach_outputs.py",
      "start": 39590524,
      "end": 39591713
    }, {
      "filename": "/5.3/scripts/addons_core/node_wrangler/operators/labels_clear.py",
      "start": 39591713,
      "end": 39592804
    }, {
      "filename": "/5.3/scripts/addons_core/node_wrangler/operators/labels_modify.py",
      "start": 39592804,
      "end": 39594215
    }, {
      "filename": "/5.3/scripts/addons_core/node_wrangler/operators/lazy_connect.py",
      "start": 39594215,
      "end": 39602241
    }, {
      "filename": "/5.3/scripts/addons_core/node_wrangler/operators/lazy_mix.py",
      "start": 39602241,
      "end": 39605308
    }, {
      "filename": "/5.3/scripts/addons_core/node_wrangler/operators/link_active_to_selected.py",
      "start": 39605308,
      "end": 39609730
    }, {
      "filename": "/5.3/scripts/addons_core/node_wrangler/operators/link_to_output.py",
      "start": 39609730,
      "end": 39613237
    }, {
      "filename": "/5.3/scripts/addons_core/node_wrangler/operators/merge_selected.py",
      "start": 39613237,
      "end": 39635116
    }, {
      "filename": "/5.3/scripts/addons_core/node_wrangler/operators/reload_images.py",
      "start": 39635116,
      "end": 39638688
    }, {
      "filename": "/5.3/scripts/addons_core/node_wrangler/operators/reset_backdrop.py",
      "start": 39638688,
      "end": 39639561
    }, {
      "filename": "/5.3/scripts/addons_core/node_wrangler/operators/reset_selected.py",
      "start": 39639561,
      "end": 39644056
    }, {
      "filename": "/5.3/scripts/addons_core/node_wrangler/operators/save_viewer_image.py",
      "start": 39644056,
      "end": 39646720
    }, {
      "filename": "/5.3/scripts/addons_core/node_wrangler/operators/select_hierarchy.py",
      "start": 39646720,
      "end": 39648504
    }, {
      "filename": "/5.3/scripts/addons_core/node_wrangler/operators/swap_links.py",
      "start": 39648504,
      "end": 39653871
    }, {
      "filename": "/5.3/scripts/addons_core/node_wrangler/preferences.py",
      "start": 39653871,
      "end": 39675322
    }, {
      "filename": "/5.3/scripts/addons_core/node_wrangler/utils/constants.py",
      "start": 39675322,
      "end": 39680807
    }, {
      "filename": "/5.3/scripts/addons_core/node_wrangler/utils/draw.py",
      "start": 39680807,
      "end": 39688971
    }, {
      "filename": "/5.3/scripts/addons_core/node_wrangler/utils/nodes.py",
      "start": 39688971,
      "end": 39698791
    }, {
      "filename": "/5.3/scripts/addons_core/node_wrangler/utils/paths.py",
      "start": 39698791,
      "end": 39704049
    }, {
      "filename": "/5.3/scripts/addons_core/node_wrangler/utils/paths_test.py",
      "start": 39704049,
      "end": 39714685
    }, {
      "filename": "/5.3/scripts/addons_core/pose_library/__init__.py",
      "start": 39714685,
      "end": 39716157
    }, {
      "filename": "/5.3/scripts/addons_core/pose_library/asset_browser.py",
      "start": 39716157,
      "end": 39719091
    }, {
      "filename": "/5.3/scripts/addons_core/pose_library/functions.py",
      "start": 39719091,
      "end": 39720622
    }, {
      "filename": "/5.3/scripts/addons_core/pose_library/gui.py",
      "start": 39720622,
      "end": 39727500
    }, {
      "filename": "/5.3/scripts/addons_core/pose_library/keymaps.py",
      "start": 39727500,
      "end": 39728310
    }, {
      "filename": "/5.3/scripts/addons_core/pose_library/operators.py",
      "start": 39728310,
      "end": 39739110
    }, {
      "filename": "/5.3/scripts/addons_core/pose_library/pose_creation.py",
      "start": 39739110,
      "end": 39754096
    }, {
      "filename": "/5.3/scripts/addons_core/pose_library/pose_usage.py",
      "start": 39754096,
      "end": 39756279
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/__init__.py",
      "start": 39756279,
      "end": 39788342
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/base_generate.py",
      "start": 39788342,
      "end": 39806940
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/base_rig.py",
      "start": 39806940,
      "end": 39817858
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/feature_set_list.py",
      "start": 39817858,
      "end": 39829562
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/feature_sets/__init__.py",
      "start": 39829562,
      "end": 39829990
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/generate.py",
      "start": 39829990,
      "end": 39856562
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/metarig_menu.py",
      "start": 39856562,
      "end": 39864723
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/metarigs/Animals/__init__.py",
      "start": 39864723,
      "end": 39864723
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/metarigs/Animals/bird.py",
      "start": 39864723,
      "end": 39920635
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/metarigs/Animals/cat.py",
      "start": 39920635,
      "end": 40035270
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/metarigs/Animals/horse.py",
      "start": 40035270,
      "end": 40089490
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/metarigs/Animals/shark.py",
      "start": 40089490,
      "end": 40117510
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/metarigs/Animals/wolf.py",
      "start": 40117510,
      "end": 40241724
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/metarigs/Basic/basic_human.py",
      "start": 40241724,
      "end": 40266182
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/metarigs/Basic/basic_quadruped.py",
      "start": 40266182,
      "end": 40294394
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/metarigs/__init__.py",
      "start": 40294394,
      "end": 40294394
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/metarigs/human.py",
      "start": 40294394,
      "end": 40399115
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/operators/__init__.py",
      "start": 40399115,
      "end": 40399861
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/operators/action_layers.py",
      "start": 40399861,
      "end": 40424541
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/operators/copy_mirror_parameters.py",
      "start": 40424541,
      "end": 40436193
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/operators/generic_ui_list.py",
      "start": 40436193,
      "end": 40442038
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/operators/upgrade_face.py",
      "start": 40442038,
      "end": 40460101
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/rig_lists.py",
      "start": 40460101,
      "end": 40463755
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/rig_ui_template.py",
      "start": 40463755,
      "end": 40511790
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/rigs/__init__.py",
      "start": 40511790,
      "end": 40511790
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/rigs/basic/__init__.py",
      "start": 40511790,
      "end": 40511790
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/rigs/basic/copy_chain.py",
      "start": 40511790,
      "end": 40516724
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/rigs/basic/pivot.py",
      "start": 40516724,
      "end": 40524445
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/rigs/basic/raw_copy.py",
      "start": 40524445,
      "end": 40532495
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/rigs/basic/super_copy.py",
      "start": 40532495,
      "end": 40538522
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/rigs/chain_rigs.py",
      "start": 40538522,
      "end": 40551315
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/rigs/experimental/__init__.py",
      "start": 40551315,
      "end": 40551315
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/rigs/experimental/super_chain.py",
      "start": 40551315,
      "end": 40580828
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/rigs/face/basic_tongue.py",
      "start": 40580828,
      "end": 40586816
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/rigs/face/skin_eye.py",
      "start": 40586816,
      "end": 40617625
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/rigs/face/skin_jaw.py",
      "start": 40617625,
      "end": 40649815
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/rigs/faces/__init__.py",
      "start": 40649815,
      "end": 40649815
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/rigs/faces/super_face.py",
      "start": 40649815,
      "end": 40741265
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/rigs/limbs/__init__.py",
      "start": 40741265,
      "end": 40741265
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/rigs/limbs/arm.py",
      "start": 40741265,
      "end": 40748122
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/rigs/limbs/front_paw.py",
      "start": 40748122,
      "end": 40757703
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/rigs/limbs/leg.py",
      "start": 40757703,
      "end": 40785460
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/rigs/limbs/limb_rigs.py",
      "start": 40785460,
      "end": 40835368
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/rigs/limbs/limb_utils.py",
      "start": 40835368,
      "end": 40837426
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/rigs/limbs/paw.py",
      "start": 40837426,
      "end": 40849534
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/rigs/limbs/rear_paw.py",
      "start": 40849534,
      "end": 40855548
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/rigs/limbs/simple_tentacle.py",
      "start": 40855548,
      "end": 40860854
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/rigs/limbs/spline_tentacle.py",
      "start": 40860854,
      "end": 40921680
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/rigs/limbs/super_finger.py",
      "start": 40921680,
      "end": 40946720
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/rigs/limbs/super_limb.py",
      "start": 40946720,
      "end": 40947649
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/rigs/limbs/super_palm.py",
      "start": 40947649,
      "end": 40962514
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/rigs/skin/anchor.py",
      "start": 40962514,
      "end": 40966716
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/rigs/skin/basic_chain.py",
      "start": 40966716,
      "end": 40988837
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/rigs/skin/glue.py",
      "start": 40988837,
      "end": 41000111
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/rigs/skin/skin_nodes.py",
      "start": 41000111,
      "end": 41021958
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/rigs/skin/skin_parents.py",
      "start": 41021958,
      "end": 41040756
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/rigs/skin/skin_rigs.py",
      "start": 41040756,
      "end": 41049637
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/rigs/skin/stretchy_chain.py",
      "start": 41049637,
      "end": 41065733
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/rigs/skin/transform/basic.py",
      "start": 41065733,
      "end": 41070196
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/rigs/spines/__init__.py",
      "start": 41070196,
      "end": 41070196
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/rigs/spines/basic_spine.py",
      "start": 41070196,
      "end": 41083859
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/rigs/spines/basic_tail.py",
      "start": 41083859,
      "end": 41091701
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/rigs/spines/spine_rigs.py",
      "start": 41091701,
      "end": 41101755
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/rigs/spines/super_head.py",
      "start": 41101755,
      "end": 41116047
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/rigs/spines/super_spine.py",
      "start": 41116047,
      "end": 41120614
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/rigs/utils.py",
      "start": 41120614,
      "end": 41126945
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/rigs/widgets.py",
      "start": 41126945,
      "end": 41163420
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/rot_mode.py",
      "start": 41163420,
      "end": 41173504
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/ui.py",
      "start": 41173504,
      "end": 41239492
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/utils/__init__.py",
      "start": 41239492,
      "end": 41241435
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/utils/action_layers.py",
      "start": 41241435,
      "end": 41257417
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/utils/animation.py",
      "start": 41257417,
      "end": 41295076
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/utils/bones.py",
      "start": 41295076,
      "end": 41320268
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/utils/collections.py",
      "start": 41320268,
      "end": 41323345
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/utils/components.py",
      "start": 41323345,
      "end": 41326911
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/utils/errors.py",
      "start": 41326911,
      "end": 41327586
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/utils/layers.py",
      "start": 41327586,
      "end": 41340123
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/utils/mechanism.py",
      "start": 41340123,
      "end": 41363810
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/utils/metaclass.py",
      "start": 41363810,
      "end": 41370957
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/utils/misc.py",
      "start": 41370957,
      "end": 41387235
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/utils/naming.py",
      "start": 41387235,
      "end": 41397132
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/utils/node_merger.py",
      "start": 41397132,
      "end": 41408584
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/utils/objects.py",
      "start": 41408584,
      "end": 41415837
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/utils/rig.py",
      "start": 41415837,
      "end": 41443273
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/utils/switch_parent.py",
      "start": 41443273,
      "end": 41464433
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/utils/widgets.py",
      "start": 41464433,
      "end": 41481681
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/utils/widgets_basic.py",
      "start": 41481681,
      "end": 41500299
    }, {
      "filename": "/5.3/scripts/addons_core/rigify/utils/widgets_special.py",
      "start": 41500299,
      "end": 41519925
    }, {
      "filename": "/5.3/scripts/addons_core/ui_translate/__init__.py",
      "start": 41519925,
      "end": 41521805
    }, {
      "filename": "/5.3/scripts/addons_core/ui_translate/settings.py",
      "start": 41521805,
      "end": 41528137
    }, {
      "filename": "/5.3/scripts/addons_core/ui_translate/update_addon.py",
      "start": 41528137,
      "end": 41541891
    }, {
      "filename": "/5.3/scripts/addons_core/ui_translate/update_repo.py",
      "start": 41541891,
      "end": 41553776
    }, {
      "filename": "/5.3/scripts/addons_core/ui_translate/update_ui.py",
      "start": 41553776,
      "end": 41562993
    }, {
      "filename": "/5.3/scripts/addons_core/viewport_vr_preview/__init__.py",
      "start": 41562993,
      "end": 41564504
    }, {
      "filename": "/5.3/scripts/addons_core/viewport_vr_preview/action_map.py",
      "start": 41564504,
      "end": 41570578
    }, {
      "filename": "/5.3/scripts/addons_core/viewport_vr_preview/action_map_io.py",
      "start": 41570578,
      "end": 41582987
    }, {
      "filename": "/5.3/scripts/addons_core/viewport_vr_preview/configs/default.py",
      "start": 41582987,
      "end": 41711112
    }, {
      "filename": "/5.3/scripts/addons_core/viewport_vr_preview/defaults.py",
      "start": 41711112,
      "end": 41816864
    }, {
      "filename": "/5.3/scripts/addons_core/viewport_vr_preview/gui.py",
      "start": 41816864,
      "end": 41830562
    }, {
      "filename": "/5.3/scripts/addons_core/viewport_vr_preview/operators.py",
      "start": 41830562,
      "end": 41870877
    }, {
      "filename": "/5.3/scripts/addons_core/viewport_vr_preview/preferences.py",
      "start": 41870877,
      "end": 41872682
    }, {
      "filename": "/5.3/scripts/addons_core/viewport_vr_preview/properties.py",
      "start": 41872682,
      "end": 41881931
    }, {
      "filename": "/5.3/scripts/addons_core/viewport_vr_preview/versioning.py",
      "start": 41881931,
      "end": 41883179
    }, {
      "filename": "/5.3/scripts/freestyle/modules/freestyle/__init__.py",
      "start": 41883179,
      "end": 41883628
    }, {
      "filename": "/5.3/scripts/freestyle/modules/freestyle/chainingiterators.py",
      "start": 41883628,
      "end": 41908595
    }, {
      "filename": "/5.3/scripts/freestyle/modules/freestyle/functions.py",
      "start": 41908595,
      "end": 41918040
    }, {
      "filename": "/5.3/scripts/freestyle/modules/freestyle/predicates.py",
      "start": 41918040,
      "end": 41938518
    }, {
      "filename": "/5.3/scripts/freestyle/modules/freestyle/shaders.py",
      "start": 41938518,
      "end": 41983668
    }, {
      "filename": "/5.3/scripts/freestyle/modules/freestyle/types.py",
      "start": 41983668,
      "end": 41987083
    }, {
      "filename": "/5.3/scripts/freestyle/modules/freestyle/utils.py",
      "start": 41987083,
      "end": 42007329
    }, {
      "filename": "/5.3/scripts/freestyle/modules/parameter_editor.py",
      "start": 42007329,
      "end": 42069361
    }, {
      "filename": "/5.3/scripts/freestyle/styles/anisotropic_diffusion.py",
      "start": 42069361,
      "end": 42070439
    }, {
      "filename": "/5.3/scripts/freestyle/styles/apriori_and_causal_density.py",
      "start": 42070439,
      "end": 42071533
    }, {
      "filename": "/5.3/scripts/freestyle/styles/apriori_density.py",
      "start": 42071533,
      "end": 42072536
    }, {
      "filename": "/5.3/scripts/freestyle/styles/backbone_stretcher.py",
      "start": 42072536,
      "end": 42073319
    }, {
      "filename": "/5.3/scripts/freestyle/styles/blueprint_circles.py",
      "start": 42073319,
      "end": 42074437
    }, {
      "filename": "/5.3/scripts/freestyle/styles/blueprint_ellipses.py",
      "start": 42074437,
      "end": 42075557
    }, {
      "filename": "/5.3/scripts/freestyle/styles/blueprint_squares.py",
      "start": 42075557,
      "end": 42076710
    }, {
      "filename": "/5.3/scripts/freestyle/styles/cartoon.py",
      "start": 42076710,
      "end": 42077635
    }, {
      "filename": "/5.3/scripts/freestyle/styles/contour.py",
      "start": 42077635,
      "end": 42078607
    }, {
      "filename": "/5.3/scripts/freestyle/styles/curvature2d.py",
      "start": 42078607,
      "end": 42079452
    }, {
      "filename": "/5.3/scripts/freestyle/styles/external_contour.py",
      "start": 42079452,
      "end": 42080338
    }, {
      "filename": "/5.3/scripts/freestyle/styles/external_contour_sketchy.py",
      "start": 42080338,
      "end": 42081508
    }, {
      "filename": "/5.3/scripts/freestyle/styles/external_contour_smooth.py",
      "start": 42081508,
      "end": 42082530
    }, {
      "filename": "/5.3/scripts/freestyle/styles/haloing.py",
      "start": 42082530,
      "end": 42083805
    }, {
      "filename": "/5.3/scripts/freestyle/styles/ignore_small_occlusions.py",
      "start": 42083805,
      "end": 42084691
    }, {
      "filename": "/5.3/scripts/freestyle/styles/invisible_lines.py",
      "start": 42084691,
      "end": 42085559
    }, {
      "filename": "/5.3/scripts/freestyle/styles/japanese_bigbrush.py",
      "start": 42085559,
      "end": 42087326
    }, {
      "filename": "/5.3/scripts/freestyle/styles/long_anisotropically_dense.py",
      "start": 42087326,
      "end": 42089703
    }, {
      "filename": "/5.3/scripts/freestyle/styles/multiple_parameterization.py",
      "start": 42089703,
      "end": 42091154
    }, {
      "filename": "/5.3/scripts/freestyle/styles/nature.py",
      "start": 42091154,
      "end": 42092221
    }, {
      "filename": "/5.3/scripts/freestyle/styles/near_lines.py",
      "start": 42092221,
      "end": 42093136
    }, {
      "filename": "/5.3/scripts/freestyle/styles/occluded_by_specific_object.py",
      "start": 42093136,
      "end": 42094152
    }, {
      "filename": "/5.3/scripts/freestyle/styles/polygonalize.py",
      "start": 42094152,
      "end": 42095032
    }, {
      "filename": "/5.3/scripts/freestyle/styles/qi0.py",
      "start": 42095032,
      "end": 42095921
    }, {
      "filename": "/5.3/scripts/freestyle/styles/qi0_not_external_contour.py",
      "start": 42095921,
      "end": 42097048
    }, {
      "filename": "/5.3/scripts/freestyle/styles/qi1.py",
      "start": 42097048,
      "end": 42098005
    }, {
      "filename": "/5.3/scripts/freestyle/styles/qi2.py",
      "start": 42098005,
      "end": 42098965
    }, {
      "filename": "/5.3/scripts/freestyle/styles/sequentialsplit_sketchy.py",
      "start": 42098965,
      "end": 42100147
    }, {
      "filename": "/5.3/scripts/freestyle/styles/sketchy_multiple_parameterization.py",
      "start": 42100147,
      "end": 42101312
    }, {
      "filename": "/5.3/scripts/freestyle/styles/sketchy_topology_broken.py",
      "start": 42101312,
      "end": 42102562
    }, {
      "filename": "/5.3/scripts/freestyle/styles/sketchy_topology_preserved.py",
      "start": 42102562,
      "end": 42103639
    }, {
      "filename": "/5.3/scripts/freestyle/styles/split_at_highest_2d_curvatures.py",
      "start": 42103639,
      "end": 42104736
    }, {
      "filename": "/5.3/scripts/freestyle/styles/split_at_tvertices.py",
      "start": 42104736,
      "end": 42105761
    }, {
      "filename": "/5.3/scripts/freestyle/styles/suggestive.py",
      "start": 42105761,
      "end": 42106723
    }, {
      "filename": "/5.3/scripts/freestyle/styles/thickness_fof_depth_discontinuity.py",
      "start": 42106723,
      "end": 42107669
    }, {
      "filename": "/5.3/scripts/freestyle/styles/tipremover.py",
      "start": 42107669,
      "end": 42108524
    }, {
      "filename": "/5.3/scripts/freestyle/styles/tvertex_remover.py",
      "start": 42108524,
      "end": 42109398
    }, {
      "filename": "/5.3/scripts/freestyle/styles/uniformpruning_zsort.py",
      "start": 42109398,
      "end": 42110341
    }, {
      "filename": "/5.3/scripts/modules/_animsys_refactor.py",
      "start": 42110341,
      "end": 42119548
    }, {
      "filename": "/5.3/scripts/modules/_bl_console_utils/__init__.py",
      "start": 42119548,
      "end": 42119709
    }, {
      "filename": "/5.3/scripts/modules/_bl_console_utils/autocomplete/__init__.py",
      "start": 42119709,
      "end": 42119895
    }, {
      "filename": "/5.3/scripts/modules/_bl_console_utils/autocomplete/complete_calltip.py",
      "start": 42119895,
      "end": 42124653
    }, {
      "filename": "/5.3/scripts/modules/_bl_console_utils/autocomplete/complete_import.py",
      "start": 42124653,
      "end": 42130150
    }, {
      "filename": "/5.3/scripts/modules/_bl_console_utils/autocomplete/complete_namespace.py",
      "start": 42130150,
      "end": 42136005
    }, {
      "filename": "/5.3/scripts/modules/_bl_console_utils/autocomplete/intellisense.py",
      "start": 42136005,
      "end": 42140611
    }, {
      "filename": "/5.3/scripts/modules/_bl_i18n_utils/__init__.py",
      "start": 42140611,
      "end": 42140754
    }, {
      "filename": "/5.3/scripts/modules/_bl_i18n_utils/bl_extract_messages.py",
      "start": 42140754,
      "end": 42199055
    }, {
      "filename": "/5.3/scripts/modules/_bl_i18n_utils/merge_po.py",
      "start": 42199055,
      "end": 42204537
    }, {
      "filename": "/5.3/scripts/modules/_bl_i18n_utils/settings.py",
      "start": 42204537,
      "end": 42233071
    }, {
      "filename": "/5.3/scripts/modules/_bl_i18n_utils/settings_user.py",
      "start": 42233071,
      "end": 42233197
    }, {
      "filename": "/5.3/scripts/modules/_bl_i18n_utils/utils.py",
      "start": 42233197,
      "end": 42306206
    }, {
      "filename": "/5.3/scripts/modules/_bl_i18n_utils/utils_cli.py",
      "start": 42306206,
      "end": 42311525
    }, {
      "filename": "/5.3/scripts/modules/_bl_i18n_utils/utils_languages_menu.py",
      "start": 42311525,
      "end": 42314096
    }, {
      "filename": "/5.3/scripts/modules/_bl_i18n_utils/utils_rtl.py",
      "start": 42314096,
      "end": 42322080
    }, {
      "filename": "/5.3/scripts/modules/_bl_i18n_utils/utils_spell_check.py",
      "start": 42322080,
      "end": 42344439
    }, {
      "filename": "/5.3/scripts/modules/_bl_previews_utils/bl_previews_render.py",
      "start": 42344439,
      "end": 42366425
    }, {
      "filename": "/5.3/scripts/modules/_bl_rna_utils/__init__.py",
      "start": 42366425,
      "end": 42366425
    }, {
      "filename": "/5.3/scripts/modules/_bl_rna_utils/data_path.py",
      "start": 42366425,
      "end": 42368661
    }, {
      "filename": "/5.3/scripts/modules/_bl_text_utils/__init__.py",
      "start": 42368661,
      "end": 42368661
    }, {
      "filename": "/5.3/scripts/modules/_bl_text_utils/external_editor.py",
      "start": 42368661,
      "end": 42370342
    }, {
      "filename": "/5.3/scripts/modules/_bl_ui_utils/__init__.py",
      "start": 42370342,
      "end": 42370342
    }, {
      "filename": "/5.3/scripts/modules/_bl_ui_utils/layout.py",
      "start": 42370342,
      "end": 42370891
    }, {
      "filename": "/5.3/scripts/modules/_blendfile_header.py",
      "start": 42370891,
      "end": 42377845
    }, {
      "filename": "/5.3/scripts/modules/_bpy_internal/__init__.py",
      "start": 42377845,
      "end": 42377943
    }, {
      "filename": "/5.3/scripts/modules/_bpy_internal/addons/__init__.py",
      "start": 42377943,
      "end": 42378036
    }, {
      "filename": "/5.3/scripts/modules/_bpy_internal/addons/cli.py",
      "start": 42378036,
      "end": 42379204
    }, {
      "filename": "/5.3/scripts/modules/_bpy_internal/assets/__init__.py",
      "start": 42379204,
      "end": 42379297
    }, {
      "filename": "/5.3/scripts/modules/_bpy_internal/assets/remote_library/__init__.py",
      "start": 42379297,
      "end": 42380015
    }, {
      "filename": "/5.3/scripts/modules/_bpy_internal/assets/remote_library/asset_downloader.py",
      "start": 42380015,
      "end": 42405195
    }, {
      "filename": "/5.3/scripts/modules/_bpy_internal/assets/remote_library/blender_asset_library_openapi.py",
      "start": 42405195,
      "end": 42413498
    }, {
      "filename": "/5.3/scripts/modules/_bpy_internal/assets/remote_library/blender_asset_library_openapi.yaml",
      "start": 42413498,
      "end": 42428054
    }, {
      "filename": "/5.3/scripts/modules/_bpy_internal/assets/remote_library/cli.py",
      "start": 42428054,
      "end": 42430156
    }, {
      "filename": "/5.3/scripts/modules/_bpy_internal/assets/remote_library/cli_listing_downloader.py",
      "start": 42430156,
      "end": 42432630
    }, {
      "filename": "/5.3/scripts/modules/_bpy_internal/assets/remote_library/cli_listing_generator.py",
      "start": 42432630,
      "end": 42442011
    }, {
      "filename": "/5.3/scripts/modules/_bpy_internal/assets/remote_library/cli_listing_generator_asset_finder.py",
      "start": 42442011,
      "end": 42451512
    }, {
      "filename": "/5.3/scripts/modules/_bpy_internal/assets/remote_library/cli_listing_generator_pagination.py",
      "start": 42451512,
      "end": 42453417
    }, {
      "filename": "/5.3/scripts/modules/_bpy_internal/assets/remote_library/hashing.py",
      "start": 42453417,
      "end": 42455595
    }, {
      "filename": "/5.3/scripts/modules/_bpy_internal/assets/remote_library/http_metadata.py",
      "start": 42455595,
      "end": 42459200
    }, {
      "filename": "/5.3/scripts/modules/_bpy_internal/assets/remote_library/json_parsing.py",
      "start": 42459200,
      "end": 42461487
    }, {
      "filename": "/5.3/scripts/modules/_bpy_internal/assets/remote_library/listing_asset_catalogs.py",
      "start": 42461487,
      "end": 42466865
    }, {
      "filename": "/5.3/scripts/modules/_bpy_internal/assets/remote_library/listing_common.py",
      "start": 42466865,
      "end": 42468060
    }, {
      "filename": "/5.3/scripts/modules/_bpy_internal/assets/remote_library/listing_downloader.py",
      "start": 42468060,
      "end": 42509512
    }, {
      "filename": "/5.3/scripts/modules/_bpy_internal/assets/remote_library/sync_mutex.py",
      "start": 42509512,
      "end": 42513656
    }, {
      "filename": "/5.3/scripts/modules/_bpy_internal/disk_file_hash_service/__init__.py",
      "start": 42513656,
      "end": 42518709
    }, {
      "filename": "/5.3/scripts/modules/_bpy_internal/disk_file_hash_service/backend_sqlite.py",
      "start": 42518709,
      "end": 42529228
    }, {
      "filename": "/5.3/scripts/modules/_bpy_internal/disk_file_hash_service/hash_service.py",
      "start": 42529228,
      "end": 42535913
    }, {
      "filename": "/5.3/scripts/modules/_bpy_internal/disk_file_hash_service/types.py",
      "start": 42535913,
      "end": 42537542
    }, {
      "filename": "/5.3/scripts/modules/_bpy_internal/extensions/__init__.py",
      "start": 42537542,
      "end": 42537635
    }, {
      "filename": "/5.3/scripts/modules/_bpy_internal/extensions/junction_module.py",
      "start": 42537635,
      "end": 42544082
    }, {
      "filename": "/5.3/scripts/modules/_bpy_internal/extensions/permissions.py",
      "start": 42544082,
      "end": 42544506
    }, {
      "filename": "/5.3/scripts/modules/_bpy_internal/extensions/stale_file_manager.py",
      "start": 42544506,
      "end": 42559775
    }, {
      "filename": "/5.3/scripts/modules/_bpy_internal/extensions/tags.py",
      "start": 42559775,
      "end": 42560907
    }, {
      "filename": "/5.3/scripts/modules/_bpy_internal/extensions/wheel_manager.py",
      "start": 42560907,
      "end": 42585466
    }, {
      "filename": "/5.3/scripts/modules/_bpy_internal/filesystem/__init__.py",
      "start": 42585466,
      "end": 42585466
    }, {
      "filename": "/5.3/scripts/modules/_bpy_internal/filesystem/locking.py",
      "start": 42585466,
      "end": 42590285
    }, {
      "filename": "/5.3/scripts/modules/_bpy_internal/grease_pencil/__init__.py",
      "start": 42590285,
      "end": 42590378
    }, {
      "filename": "/5.3/scripts/modules/_bpy_internal/grease_pencil/stroke.py",
      "start": 42590378,
      "end": 42606134
    }, {
      "filename": "/5.3/scripts/modules/_bpy_internal/http/__init__.py",
      "start": 42606134,
      "end": 42606227
    }, {
      "filename": "/5.3/scripts/modules/_bpy_internal/http/downloader.py",
      "start": 42606227,
      "end": 42669663
    }, {
      "filename": "/5.3/scripts/modules/_bpy_internal/platform/__init__.py",
      "start": 42669663,
      "end": 42669756
    }, {
      "filename": "/5.3/scripts/modules/_bpy_internal/platform/freedesktop.py",
      "start": 42669756,
      "end": 42689826
    }, {
      "filename": "/5.3/scripts/modules/_bpy_internal/system_info/text_generate_runtime.py",
      "start": 42689826,
      "end": 42699173
    }, {
      "filename": "/5.3/scripts/modules/_bpy_internal/system_info/url_prefill_runtime.py",
      "start": 42699173,
      "end": 42700889
    }, {
      "filename": "/5.3/scripts/modules/_bpy_internal/system_info/url_prefill_startup.py",
      "start": 42700889,
      "end": 42704483
    }, {
      "filename": "/5.3/scripts/modules/_bpy_restrict_state.py",
      "start": 42704483,
      "end": 42705479
    }, {
      "filename": "/5.3/scripts/modules/_bpy_types.py",
      "start": 42705479,
      "end": 42760542
    }, {
      "filename": "/5.3/scripts/modules/_console_python.py",
      "start": 42760542,
      "end": 42771364
    }, {
      "filename": "/5.3/scripts/modules/_console_shell.py",
      "start": 42771364,
      "end": 42772723
    }, {
      "filename": "/5.3/scripts/modules/_graphviz_export.py",
      "start": 42772723,
      "end": 42779094
    }, {
      "filename": "/5.3/scripts/modules/_keyingsets_utils.py",
      "start": 42779094,
      "end": 42790106
    }, {
      "filename": "/5.3/scripts/modules/_rna_info.py",
      "start": 42790106,
      "end": 42828581
    }, {
      "filename": "/5.3/scripts/modules/_rna_manual_reference.py",
      "start": 42828581,
      "end": 43414804
    }, {
      "filename": "/5.3/scripts/modules/_rna_xml.py",
      "start": 43414804,
      "end": 43430870
    }, {
      "filename": "/5.3/scripts/modules/addon_utils.py",
      "start": 43430870,
      "end": 43508372
    }, {
      "filename": "/5.3/scripts/modules/bl_app_override/__init__.py",
      "start": 43508372,
      "end": 43515677
    }, {
      "filename": "/5.3/scripts/modules/bl_app_override/helpers.py",
      "start": 43515677,
      "end": 43519769
    }, {
      "filename": "/5.3/scripts/modules/bl_app_template_utils.py",
      "start": 43519769,
      "end": 43524939
    }, {
      "filename": "/5.3/scripts/modules/bl_keymap_utils/__init__.py",
      "start": 43524939,
      "end": 43525113
    }, {
      "filename": "/5.3/scripts/modules/bl_keymap_utils/io.py",
      "start": 43525113,
      "end": 43536003
    }, {
      "filename": "/5.3/scripts/modules/bl_keymap_utils/keymap_from_toolbar.py",
      "start": 43536003,
      "end": 43551033
    }, {
      "filename": "/5.3/scripts/modules/bl_keymap_utils/keymap_hierarchy.py",
      "start": 43551033,
      "end": 43560697
    }, {
      "filename": "/5.3/scripts/modules/bl_keymap_utils/platform_helpers.py",
      "start": 43560697,
      "end": 43562715
    }, {
      "filename": "/5.3/scripts/modules/bl_keymap_utils/versioning.py",
      "start": 43562715,
      "end": 43579360
    }, {
      "filename": "/5.3/scripts/modules/blend_render_info.py",
      "start": 43579360,
      "end": 43583191
    }, {
      "filename": "/5.3/scripts/modules/bpy/__init__.py",
      "start": 43583191,
      "end": 43584889
    }, {
      "filename": "/5.3/scripts/modules/bpy/ops.py",
      "start": 43584889,
      "end": 43586682
    }, {
      "filename": "/5.3/scripts/modules/bpy/path.py",
      "start": 43586682,
      "end": 43601193
    }, {
      "filename": "/5.3/scripts/modules/bpy/utils/__init__.py",
      "start": 43601193,
      "end": 43648649
    }, {
      "filename": "/5.3/scripts/modules/bpy/utils/previews.py",
      "start": 43648649,
      "end": 43652235
    }, {
      "filename": "/5.3/scripts/modules/bpy/utils/toolsystem.py",
      "start": 43652235,
      "end": 43652503
    }, {
      "filename": "/5.3/scripts/modules/bpy_extras/__init__.py",
      "start": 43652503,
      "end": 43652864
    }, {
      "filename": "/5.3/scripts/modules/bpy_extras/anim_utils.py",
      "start": 43652864,
      "end": 43694887
    }, {
      "filename": "/5.3/scripts/modules/bpy_extras/asset_utils.py",
      "start": 43694887,
      "end": 43697492
    }, {
      "filename": "/5.3/scripts/modules/bpy_extras/bmesh_utils.py",
      "start": 43697492,
      "end": 43699131
    }, {
      "filename": "/5.3/scripts/modules/bpy_extras/id_map_utils.py",
      "start": 43699131,
      "end": 43700862
    }, {
      "filename": "/5.3/scripts/modules/bpy_extras/image_utils.py",
      "start": 43700862,
      "end": 43707418
    }, {
      "filename": "/5.3/scripts/modules/bpy_extras/io_utils.py",
      "start": 43707418,
      "end": 43733615
    }, {
      "filename": "/5.3/scripts/modules/bpy_extras/keyconfig_utils.py",
      "start": 43733615,
      "end": 43739084
    }, {
      "filename": "/5.3/scripts/modules/bpy_extras/mesh_utils.py",
      "start": 43739084,
      "end": 43754497
    }, {
      "filename": "/5.3/scripts/modules/bpy_extras/node_shader_utils.py",
      "start": 43754497,
      "end": 43784895
    }, {
      "filename": "/5.3/scripts/modules/bpy_extras/node_utils.py",
      "start": 43784895,
      "end": 43788234
    }, {
      "filename": "/5.3/scripts/modules/bpy_extras/object_utils.py",
      "start": 43788234,
      "end": 43798791
    }, {
      "filename": "/5.3/scripts/modules/bpy_extras/view3d_utils.py",
      "start": 43798791,
      "end": 43805052
    }, {
      "filename": "/5.3/scripts/modules/bpy_extras/wm_utils/progress_report.py",
      "start": 43805052,
      "end": 43810567
    }, {
      "filename": "/5.3/scripts/modules/gpu_extras/__init__.py",
      "start": 43810567,
      "end": 43810708
    }, {
      "filename": "/5.3/scripts/modules/gpu_extras/batch.py",
      "start": 43810708,
      "end": 43813579
    }, {
      "filename": "/5.3/scripts/modules/gpu_extras/presets.py",
      "start": 43813579,
      "end": 43817409
    }, {
      "filename": "/5.3/scripts/modules/nodeitems_utils.py",
      "start": 43817409,
      "end": 43822563
    }, {
      "filename": "/5.3/scripts/modules/rna_keymap_ui.py",
      "start": 43822563,
      "end": 43843281
    }, {
      "filename": "/5.3/scripts/modules/rna_prop_ui.py",
      "start": 43843281,
      "end": 43851911
    }, {
      "filename": "/5.3/scripts/presets/camera/1_inch.py",
      "start": 43851911,
      "end": 43852046
    }, {
      "filename": "/5.3/scripts/presets/camera/1_slash_1.8_inch.py",
      "start": 43852046,
      "end": 43852181
    }, {
      "filename": "/5.3/scripts/presets/camera/1_slash_2.3_inch.py",
      "start": 43852181,
      "end": 43852316
    }, {
      "filename": "/5.3/scripts/presets/camera/1_slash_2.5_inch.py",
      "start": 43852316,
      "end": 43852451
    }, {
      "filename": "/5.3/scripts/presets/camera/1_slash_2.7_inch.py",
      "start": 43852451,
      "end": 43852586
    }, {
      "filename": "/5.3/scripts/presets/camera/1_slash_3.2_inch.py",
      "start": 43852586,
      "end": 43852721
    }, {
      "filename": "/5.3/scripts/presets/camera/2_slash_3_inch.py",
      "start": 43852721,
      "end": 43852854
    }, {
      "filename": "/5.3/scripts/presets/camera/APS-C.py",
      "start": 43852854,
      "end": 43852989
    }, {
      "filename": "/5.3/scripts/presets/camera/APS-C_(Canon).py",
      "start": 43852989,
      "end": 43853126
    }, {
      "filename": "/5.3/scripts/presets/camera/APS-H_(Canon).py",
      "start": 43853126,
      "end": 43853263
    }, {
      "filename": "/5.3/scripts/presets/camera/Analog_16mm.py",
      "start": 43853263,
      "end": 43853399
    }, {
      "filename": "/5.3/scripts/presets/camera/Analog_35mm.py",
      "start": 43853399,
      "end": 43853530
    }, {
      "filename": "/5.3/scripts/presets/camera/Analog_65mm.py",
      "start": 43853530,
      "end": 43853667
    }, {
      "filename": "/5.3/scripts/presets/camera/Analog_IMAX.py",
      "start": 43853667,
      "end": 43853804
    }, {
      "filename": "/5.3/scripts/presets/camera/Analog_Super_16.py",
      "start": 43853804,
      "end": 43853940
    }, {
      "filename": "/5.3/scripts/presets/camera/Analog_Super_35.py",
      "start": 43853940,
      "end": 43854077
    }, {
      "filename": "/5.3/scripts/presets/camera/Arri_Alexa_65.py",
      "start": 43854077,
      "end": 43854214
    }, {
      "filename": "/5.3/scripts/presets/camera/Arri_Alexa_LF.py",
      "start": 43854214,
      "end": 43854351
    }, {
      "filename": "/5.3/scripts/presets/camera/Arri_Alexa_Mini_&_SXT.py",
      "start": 43854351,
      "end": 43854488
    }, {
      "filename": "/5.3/scripts/presets/camera/Blackmagic_Pocket_&_Studio.py",
      "start": 43854488,
      "end": 43854624
    }, {
      "filename": "/5.3/scripts/presets/camera/Blackmagic_Pocket_4K.py",
      "start": 43854624,
      "end": 43854761
    }, {
      "filename": "/5.3/scripts/presets/camera/Blackmagic_Pocket_6k.py",
      "start": 43854761,
      "end": 43854898
    }, {
      "filename": "/5.3/scripts/presets/camera/Blackmagic_URSA_4.6K.py",
      "start": 43854898,
      "end": 43855035
    }, {
      "filename": "/5.3/scripts/presets/camera/Foveon_(Sigma).py",
      "start": 43855035,
      "end": 43855172
    }, {
      "filename": "/5.3/scripts/presets/camera/Fullframe.py",
      "start": 43855172,
      "end": 43855303
    }, {
      "filename": "/5.3/scripts/presets/camera/MFT.py",
      "start": 43855303,
      "end": 43855438
    }, {
      "filename": "/5.3/scripts/presets/camera/Medium-format_(Hasselblad).py",
      "start": 43855438,
      "end": 43855569
    }, {
      "filename": "/5.3/scripts/presets/camera/RED_Dragon_5K.py",
      "start": 43855569,
      "end": 43855705
    }, {
      "filename": "/5.3/scripts/presets/camera/RED_Dragon_6K.py",
      "start": 43855705,
      "end": 43855842
    }, {
      "filename": "/5.3/scripts/presets/camera/RED_Helium_8K.py",
      "start": 43855842,
      "end": 43855979
    }, {
      "filename": "/5.3/scripts/presets/camera/RED_Monstro_8K.py",
      "start": 43855979,
      "end": 43856116
    }, {
      "filename": "/5.3/scripts/presets/cloth/Cotton.py",
      "start": 43856116,
      "end": 43857405
    }, {
      "filename": "/5.3/scripts/presets/cloth/Denim.py",
      "start": 43857405,
      "end": 43858687
    }, {
      "filename": "/5.3/scripts/presets/cloth/Leather.py",
      "start": 43858687,
      "end": 43859973
    }, {
      "filename": "/5.3/scripts/presets/cloth/Rubber.py",
      "start": 43859973,
      "end": 43861254
    }, {
      "filename": "/5.3/scripts/presets/cloth/Silk.py",
      "start": 43861254,
      "end": 43862535
    }, {
      "filename": "/5.3/scripts/presets/color_management/white_balance/Illuminant_A.py",
      "start": 43862535,
      "end": 43862681
    }, {
      "filename": "/5.3/scripts/presets/color_management/white_balance/Illuminant_B.py",
      "start": 43862681,
      "end": 43862828
    }, {
      "filename": "/5.3/scripts/presets/color_management/white_balance/Illuminant_C.py",
      "start": 43862828,
      "end": 43862975
    }, {
      "filename": "/5.3/scripts/presets/color_management/white_balance/Illuminant_D50.py",
      "start": 43862975,
      "end": 43863121
    }, {
      "filename": "/5.3/scripts/presets/color_management/white_balance/Illuminant_D55.py",
      "start": 43863121,
      "end": 43863268
    }, {
      "filename": "/5.3/scripts/presets/color_management/white_balance/Illuminant_D65.py",
      "start": 43863268,
      "end": 43863414
    }, {
      "filename": "/5.3/scripts/presets/color_management/white_balance/Illuminant_D75.py",
      "start": 43863414,
      "end": 43863560
    }, {
      "filename": "/5.3/scripts/presets/color_management/white_balance/Illuminant_D93.py",
      "start": 43863560,
      "end": 43863706
    }, {
      "filename": "/5.3/scripts/presets/color_management/white_balance/Illuminant_E.py",
      "start": 43863706,
      "end": 43863854
    }, {
      "filename": "/5.3/scripts/presets/color_management/white_balance/Illuminant_F1.py",
      "start": 43863854,
      "end": 43864001
    }, {
      "filename": "/5.3/scripts/presets/color_management/white_balance/Illuminant_F10.py",
      "start": 43864001,
      "end": 43864148
    }, {
      "filename": "/5.3/scripts/presets/color_management/white_balance/Illuminant_F11.py",
      "start": 43864148,
      "end": 43864294
    }, {
      "filename": "/5.3/scripts/presets/color_management/white_balance/Illuminant_F12.py",
      "start": 43864294,
      "end": 43864440
    }, {
      "filename": "/5.3/scripts/presets/color_management/white_balance/Illuminant_F2.py",
      "start": 43864440,
      "end": 43864586
    }, {
      "filename": "/5.3/scripts/presets/color_management/white_balance/Illuminant_F3.py",
      "start": 43864586,
      "end": 43864732
    }, {
      "filename": "/5.3/scripts/presets/color_management/white_balance/Illuminant_F4.py",
      "start": 43864732,
      "end": 43864879
    }, {
      "filename": "/5.3/scripts/presets/color_management/white_balance/Illuminant_F5.py",
      "start": 43864879,
      "end": 43865026
    }, {
      "filename": "/5.3/scripts/presets/color_management/white_balance/Illuminant_F6.py",
      "start": 43865026,
      "end": 43865173
    }, {
      "filename": "/5.3/scripts/presets/color_management/white_balance/Illuminant_F7.py",
      "start": 43865173,
      "end": 43865320
    }, {
      "filename": "/5.3/scripts/presets/color_management/white_balance/Illuminant_F8.py",
      "start": 43865320,
      "end": 43865466
    }, {
      "filename": "/5.3/scripts/presets/color_management/white_balance/Illuminant_F9.py",
      "start": 43865466,
      "end": 43865612
    }, {
      "filename": "/5.3/scripts/presets/color_management/white_balance/Illuminant_LED-B1.py",
      "start": 43865612,
      "end": 43865759
    }, {
      "filename": "/5.3/scripts/presets/color_management/white_balance/Illuminant_LED-B2.py",
      "start": 43865759,
      "end": 43865906
    }, {
      "filename": "/5.3/scripts/presets/color_management/white_balance/Illuminant_LED-B3.py",
      "start": 43865906,
      "end": 43866053
    }, {
      "filename": "/5.3/scripts/presets/color_management/white_balance/Illuminant_LED-B4.py",
      "start": 43866053,
      "end": 43866199
    }, {
      "filename": "/5.3/scripts/presets/color_management/white_balance/Illuminant_LED-B5.py",
      "start": 43866199,
      "end": 43866345
    }, {
      "filename": "/5.3/scripts/presets/color_management/white_balance/Illuminant_LED-BH1.py",
      "start": 43866345,
      "end": 43866492
    }, {
      "filename": "/5.3/scripts/presets/color_management/white_balance/Illuminant_LED-RGB1.py",
      "start": 43866492,
      "end": 43866639
    }, {
      "filename": "/5.3/scripts/presets/color_management/white_balance/Illuminant_LED-V1.py",
      "start": 43866639,
      "end": 43866786
    }, {
      "filename": "/5.3/scripts/presets/color_management/white_balance/Illuminant_LED-V2.py",
      "start": 43866786,
      "end": 43866932
    }, {
      "filename": "/5.3/scripts/presets/cycles/integrator/Default.py",
      "start": 43866932,
      "end": 43867295
    }, {
      "filename": "/5.3/scripts/presets/cycles/integrator/Direct_Light.py",
      "start": 43867295,
      "end": 43867658
    }, {
      "filename": "/5.3/scripts/presets/cycles/integrator/Fast_Global_Illumination.py",
      "start": 43867658,
      "end": 43868020
    }, {
      "filename": "/5.3/scripts/presets/cycles/integrator/Full_Global_Illumination.py",
      "start": 43868020,
      "end": 43868387
    }, {
      "filename": "/5.3/scripts/presets/cycles/integrator/Limited_Global_Illumination.py",
      "start": 43868387,
      "end": 43868750
    }, {
      "filename": "/5.3/scripts/presets/cycles/performance/Default.py",
      "start": 43868750,
      "end": 43869060
    }, {
      "filename": "/5.3/scripts/presets/cycles/performance/Faster_Render.py",
      "start": 43869060,
      "end": 43869368
    }, {
      "filename": "/5.3/scripts/presets/cycles/performance/Lower_Memory.py",
      "start": 43869368,
      "end": 43869676
    }, {
      "filename": "/5.3/scripts/presets/cycles/sampling/Final.py",
      "start": 43869676,
      "end": 43870026
    }, {
      "filename": "/5.3/scripts/presets/cycles/sampling/Preview.py",
      "start": 43870026,
      "end": 43870375
    }, {
      "filename": "/5.3/scripts/presets/cycles/viewport_sampling/Final.py",
      "start": 43870375,
      "end": 43870765
    }, {
      "filename": "/5.3/scripts/presets/cycles/viewport_sampling/Preview.py",
      "start": 43870765,
      "end": 43871132
    }, {
      "filename": "/5.3/scripts/presets/eevee/raytracing/Default.py",
      "start": 43871132,
      "end": 43871792
    }, {
      "filename": "/5.3/scripts/presets/ffmpeg/DVD_(note_colon__this_changes_render_resolution).py",
      "start": 43871792,
      "end": 43872677
    }, {
      "filename": "/5.3/scripts/presets/ffmpeg/H264_in_MP4.py",
      "start": 43872677,
      "end": 43873305
    }, {
      "filename": "/5.3/scripts/presets/ffmpeg/H264_in_Matroska.py",
      "start": 43873305,
      "end": 43873874
    }, {
      "filename": "/5.3/scripts/presets/ffmpeg/H264_in_Matroska_for_scrubbing.py",
      "start": 43873874,
      "end": 43874351
    }, {
      "filename": "/5.3/scripts/presets/ffmpeg/Ogg_Theora.py",
      "start": 43874351,
      "end": 43874979
    }, {
      "filename": "/5.3/scripts/presets/ffmpeg/WebM_(VP9+Opus).py",
      "start": 43874979,
      "end": 43875217
    }, {
      "filename": "/5.3/scripts/presets/ffmpeg/Xvid.py",
      "start": 43875217,
      "end": 43875844
    }, {
      "filename": "/5.3/scripts/presets/fluid/Honey.py",
      "start": 43875844,
      "end": 43875967
    }, {
      "filename": "/5.3/scripts/presets/fluid/Oil.py",
      "start": 43875967,
      "end": 43876090
    }, {
      "filename": "/5.3/scripts/presets/fluid/Water.py",
      "start": 43876090,
      "end": 43876213
    }, {
      "filename": "/5.3/scripts/presets/framerate/12.py",
      "start": 43876213,
      "end": 43876296
    }, {
      "filename": "/5.3/scripts/presets/framerate/120.py",
      "start": 43876296,
      "end": 43876380
    }, {
      "filename": "/5.3/scripts/presets/framerate/23.98.py",
      "start": 43876380,
      "end": 43876467
    }, {
      "filename": "/5.3/scripts/presets/framerate/24.py",
      "start": 43876467,
      "end": 43876550
    }, {
      "filename": "/5.3/scripts/presets/framerate/240.py",
      "start": 43876550,
      "end": 43876634
    }, {
      "filename": "/5.3/scripts/presets/framerate/25.py",
      "start": 43876634,
      "end": 43876717
    }, {
      "filename": "/5.3/scripts/presets/framerate/29.97.py",
      "start": 43876717,
      "end": 43876804
    }, {
      "filename": "/5.3/scripts/presets/framerate/30.py",
      "start": 43876804,
      "end": 43876887
    }, {
      "filename": "/5.3/scripts/presets/framerate/50.py",
      "start": 43876887,
      "end": 43876970
    }, {
      "filename": "/5.3/scripts/presets/framerate/59.94.py",
      "start": 43876970,
      "end": 43877057
    }, {
      "filename": "/5.3/scripts/presets/framerate/6.py",
      "start": 43877057,
      "end": 43877139
    }, {
      "filename": "/5.3/scripts/presets/framerate/60.py",
      "start": 43877139,
      "end": 43877222
    }, {
      "filename": "/5.3/scripts/presets/framerate/8.py",
      "start": 43877222,
      "end": 43877304
    }, {
      "filename": "/5.3/scripts/presets/framerate/Custom.py",
      "start": 43877304,
      "end": 43877315
    }, {
      "filename": "/5.3/scripts/presets/gpencil_material/Fill_Only.py",
      "start": 43877315,
      "end": 43877986
    }, {
      "filename": "/5.3/scripts/presets/gpencil_material/Stroke_Only.py",
      "start": 43877986,
      "end": 43878657
    }, {
      "filename": "/5.3/scripts/presets/gpencil_material/Stroke_and_Fill.py",
      "start": 43878657,
      "end": 43879328
    }, {
      "filename": "/5.3/scripts/presets/hair_dynamics/Default.py",
      "start": 43879328,
      "end": 43879890
    }, {
      "filename": "/5.3/scripts/presets/interface_theme/Blender_Dark.xml",
      "start": 43879890,
      "end": 43879955
    }, {
      "filename": "/5.3/scripts/presets/interface_theme/Blender_Light.xml",
      "start": 43879955,
      "end": 43914045
    }, {
      "filename": "/5.3/scripts/presets/keyconfig/Blender.py",
      "start": 43914045,
      "end": 43927259
    }, {
      "filename": "/5.3/scripts/presets/keyconfig/Blender_27x.py",
      "start": 43927259,
      "end": 43930264
    }, {
      "filename": "/5.3/scripts/presets/keyconfig/Industry_Compatible.py",
      "start": 43930264,
      "end": 43931387
    }, {
      "filename": "/5.3/scripts/presets/keyconfig/keymap_data/blender_default.py",
      "start": 43931387,
      "end": 44378932
    }, {
      "filename": "/5.3/scripts/presets/keyconfig/keymap_data/industry_compatible_data.py",
      "start": 44378932,
      "end": 44592521
    }, {
      "filename": "/5.3/scripts/presets/pixel_density/Custom.py",
      "start": 44592521,
      "end": 44592532
    }, {
      "filename": "/5.3/scripts/presets/pixel_density/Pixels_slash_Centimeter.py",
      "start": 44592532,
      "end": 44592584
    }, {
      "filename": "/5.3/scripts/presets/pixel_density/Pixels_slash_Inch.py",
      "start": 44592584,
      "end": 44592638
    }, {
      "filename": "/5.3/scripts/presets/pixel_density/Pixels_slash_Meter.py",
      "start": 44592638,
      "end": 44592689
    }, {
      "filename": "/5.3/scripts/presets/render/4K_DCI_2160p.py",
      "start": 44592689,
      "end": 44593003
    }, {
      "filename": "/5.3/scripts/presets/render/4K_UHDTV_2160p.py",
      "start": 44593003,
      "end": 44593317
    }, {
      "filename": "/5.3/scripts/presets/render/4K_UW_1600p.py",
      "start": 44593317,
      "end": 44593631
    }, {
      "filename": "/5.3/scripts/presets/render/DVCPRO_HD_1080p.py",
      "start": 44593631,
      "end": 44593945
    }, {
      "filename": "/5.3/scripts/presets/render/DVCPRO_HD_720p.py",
      "start": 44593945,
      "end": 44594257
    }, {
      "filename": "/5.3/scripts/presets/render/HDTV_1080p.py",
      "start": 44594257,
      "end": 44594571
    }, {
      "filename": "/5.3/scripts/presets/render/HDTV_720p.py",
      "start": 44594571,
      "end": 44594884
    }, {
      "filename": "/5.3/scripts/presets/render/HDV_1080p.py",
      "start": 44594884,
      "end": 44595202
    }, {
      "filename": "/5.3/scripts/presets/render/HDV_NTSC_1080p.py",
      "start": 44595202,
      "end": 44595520
    }, {
      "filename": "/5.3/scripts/presets/render/HDV_PAL_1080p.py",
      "start": 44595520,
      "end": 44595834
    }, {
      "filename": "/5.3/scripts/presets/render/TV_NTSC_16_colon_9.py",
      "start": 44595834,
      "end": 44596152
    }, {
      "filename": "/5.3/scripts/presets/render/TV_NTSC_4_colon_3.py",
      "start": 44596152,
      "end": 44596470
    }, {
      "filename": "/5.3/scripts/presets/render/TV_PAL_16_colon_9.py",
      "start": 44596470,
      "end": 44596784
    }, {
      "filename": "/5.3/scripts/presets/render/TV_PAL_4_colon_3.py",
      "start": 44596784,
      "end": 44597098
    }, {
      "filename": "/5.3/scripts/presets/safe_areas/14_colon_9_in_16_colon_9.py",
      "start": 44597098,
      "end": 44597296
    }, {
      "filename": "/5.3/scripts/presets/safe_areas/16_colon_9.py",
      "start": 44597296,
      "end": 44597491
    }, {
      "filename": "/5.3/scripts/presets/safe_areas/4_colon_3_in_16_colon_9.py",
      "start": 44597491,
      "end": 44597691
    }, {
      "filename": "/5.3/scripts/presets/sequencer/text_style/Corner_Title.py",
      "start": 44597691,
      "end": 44598232
    }, {
      "filename": "/5.3/scripts/presets/sequencer/text_style/Main_Title.py",
      "start": 44598232,
      "end": 44598776
    }, {
      "filename": "/5.3/scripts/presets/sequencer/text_style/Subtitle.py",
      "start": 44598776,
      "end": 44599321
    }, {
      "filename": "/5.3/scripts/presets/text_editor/Internal.py",
      "start": 44599321,
      "end": 44599439
    }, {
      "filename": "/5.3/scripts/presets/text_editor/Visual_Studio_Code.py",
      "start": 44599439,
      "end": 44599712
    }, {
      "filename": "/5.3/scripts/presets/tracking_camera/1_inch.py",
      "start": 44599712,
      "end": 44599856
    }, {
      "filename": "/5.3/scripts/presets/tracking_camera/1_slash_1.8_inch.py",
      "start": 44599856,
      "end": 446e5
    }, {
      "filename": "/5.3/scripts/presets/tracking_camera/1_slash_2.3_inch.py",
      "start": 446e5,
      "end": 44600144
    }, {
      "filename": "/5.3/scripts/presets/tracking_camera/1_slash_2.5_inch.py",
      "start": 44600144,
      "end": 44600288
    }, {
      "filename": "/5.3/scripts/presets/tracking_camera/1_slash_2.7_inch.py",
      "start": 44600288,
      "end": 44600432
    }, {
      "filename": "/5.3/scripts/presets/tracking_camera/1_slash_3.2_inch.py",
      "start": 44600432,
      "end": 44600576
    }, {
      "filename": "/5.3/scripts/presets/tracking_camera/2_slash_3_inch.py",
      "start": 44600576,
      "end": 44600719
    }, {
      "filename": "/5.3/scripts/presets/tracking_camera/APS-C.py",
      "start": 44600719,
      "end": 44600863
    }, {
      "filename": "/5.3/scripts/presets/tracking_camera/APS-C_(Canon).py",
      "start": 44600863,
      "end": 44601008
    }, {
      "filename": "/5.3/scripts/presets/tracking_camera/APS-H_(Canon).py",
      "start": 44601008,
      "end": 44601153
    }, {
      "filename": "/5.3/scripts/presets/tracking_camera/Analog_16mm.py",
      "start": 44601153,
      "end": 44601298
    }, {
      "filename": "/5.3/scripts/presets/tracking_camera/Analog_35mm.py",
      "start": 44601298,
      "end": 44601440
    }, {
      "filename": "/5.3/scripts/presets/tracking_camera/Analog_65mm.py",
      "start": 44601440,
      "end": 44601585
    }, {
      "filename": "/5.3/scripts/presets/tracking_camera/Analog_IMAX.py",
      "start": 44601585,
      "end": 44601730
    }, {
      "filename": "/5.3/scripts/presets/tracking_camera/Analog_Super_16.py",
      "start": 44601730,
      "end": 44601875
    }, {
      "filename": "/5.3/scripts/presets/tracking_camera/Analog_Super_35.py",
      "start": 44601875,
      "end": 44602020
    }, {
      "filename": "/5.3/scripts/presets/tracking_camera/Arri_Alexa_65.py",
      "start": 44602020,
      "end": 44602165
    }, {
      "filename": "/5.3/scripts/presets/tracking_camera/Arri_Alexa_LF.py",
      "start": 44602165,
      "end": 44602310
    }, {
      "filename": "/5.3/scripts/presets/tracking_camera/Arri_Alexa_Mini_&_SXT.py",
      "start": 44602310,
      "end": 44602455
    }, {
      "filename": "/5.3/scripts/presets/tracking_camera/Blackmagic_Pocket_&_Studio.py",
      "start": 44602455,
      "end": 44602600
    }, {
      "filename": "/5.3/scripts/presets/tracking_camera/Blackmagic_Pocket_4K.py",
      "start": 44602600,
      "end": 44602745
    }, {
      "filename": "/5.3/scripts/presets/tracking_camera/Blackmagic_Pocket_6k.py",
      "start": 44602745,
      "end": 44602890
    }, {
      "filename": "/5.3/scripts/presets/tracking_camera/Blackmagic_URSA_4.6K.py",
      "start": 44602890,
      "end": 44603035
    }, {
      "filename": "/5.3/scripts/presets/tracking_camera/Foveon_(Sigma).py",
      "start": 44603035,
      "end": 44603180
    }, {
      "filename": "/5.3/scripts/presets/tracking_camera/Fullframe.py",
      "start": 44603180,
      "end": 44603322
    }, {
      "filename": "/5.3/scripts/presets/tracking_camera/MFT.py",
      "start": 44603322,
      "end": 44603466
    }, {
      "filename": "/5.3/scripts/presets/tracking_camera/Medium-format_(Hasselblad).py",
      "start": 44603466,
      "end": 44603608
    }, {
      "filename": "/5.3/scripts/presets/tracking_camera/RED_Dragon_5K.py",
      "start": 44603608,
      "end": 44603753
    }, {
      "filename": "/5.3/scripts/presets/tracking_camera/RED_Dragon_6K.py",
      "start": 44603753,
      "end": 44603898
    }, {
      "filename": "/5.3/scripts/presets/tracking_camera/RED_Helium_8K.py",
      "start": 44603898,
      "end": 44604043
    }, {
      "filename": "/5.3/scripts/presets/tracking_camera/RED_Monstro_8K.py",
      "start": 44604043,
      "end": 44604188
    }, {
      "filename": "/5.3/scripts/presets/tracking_settings/Blurry_Footage.py",
      "start": 44604188,
      "end": 44604775
    }, {
      "filename": "/5.3/scripts/presets/tracking_settings/Default.py",
      "start": 44604775,
      "end": 44605361
    }, {
      "filename": "/5.3/scripts/presets/tracking_settings/Fast_Motion.py",
      "start": 44605361,
      "end": 44605951
    }, {
      "filename": "/5.3/scripts/presets/tracking_settings/Planar.py",
      "start": 44605951,
      "end": 44606546
    }, {
      "filename": "/5.3/scripts/presets/tracking_track_color/Default.py",
      "start": 44606546,
      "end": 44606677
    }, {
      "filename": "/5.3/scripts/presets/tracking_track_color/Far_Plane.py",
      "start": 44606677,
      "end": 44606807
    }, {
      "filename": "/5.3/scripts/presets/tracking_track_color/Near_Plane.py",
      "start": 44606807,
      "end": 44606937
    }, {
      "filename": "/5.3/scripts/presets/tracking_track_color/Object.py",
      "start": 44606937,
      "end": 44607067
    }, {
      "filename": "/5.3/scripts/site/sitecustomize.py",
      "start": 44607067,
      "end": 44609595
    }, {
      "filename": "/5.3/scripts/startup/bl_app_templates_system/2D_Animation/__init__.py",
      "start": 44609595,
      "end": 44611219
    }, {
      "filename": "/5.3/scripts/startup/bl_app_templates_system/2D_Animation/startup.blend",
      "start": 44611219,
      "end": 44717548
    }, {
      "filename": "/5.3/scripts/startup/bl_app_templates_system/Sculpting/__init__.py",
      "start": 44717548,
      "end": 44718422
    }, {
      "filename": "/5.3/scripts/startup/bl_app_templates_system/Sculpting/startup.blend",
      "start": 44718422,
      "end": 44812399
    }, {
      "filename": "/5.3/scripts/startup/bl_app_templates_system/Storyboarding/__init__.py",
      "start": 44812399,
      "end": 44813852
    }, {
      "filename": "/5.3/scripts/startup/bl_app_templates_system/Storyboarding/startup.blend",
      "start": 44813852,
      "end": 44925343
    }, {
      "filename": "/5.3/scripts/startup/bl_app_templates_system/VFX/startup.blend",
      "start": 44925343,
      "end": 45018483
    }, {
      "filename": "/5.3/scripts/startup/bl_app_templates_system/Video_Editing/__init__.py",
      "start": 45018483,
      "end": 45019910
    }, {
      "filename": "/5.3/scripts/startup/bl_app_templates_system/Video_Editing/startup.blend",
      "start": 45019910,
      "end": 45112053
    }, {
      "filename": "/5.3/scripts/startup/bl_operators/__init__.py",
      "start": 45112053,
      "end": 45114009
    }, {
      "filename": "/5.3/scripts/startup/bl_operators/add_mesh_torus.py",
      "start": 45114009,
      "end": 45121374
    }, {
      "filename": "/5.3/scripts/startup/bl_operators/anim.py",
      "start": 45121374,
      "end": 45155486
    }, {
      "filename": "/5.3/scripts/startup/bl_operators/assets.py",
      "start": 45155486,
      "end": 45161476
    }, {
      "filename": "/5.3/scripts/startup/bl_operators/bmesh/find_adjacent.py",
      "start": 45161476,
      "end": 45172302
    }, {
      "filename": "/5.3/scripts/startup/bl_operators/bone_selection_sets.py",
      "start": 45172302,
      "end": 45186188
    }, {
      "filename": "/5.3/scripts/startup/bl_operators/clip.py",
      "start": 45186188,
      "end": 45219103
    }, {
      "filename": "/5.3/scripts/startup/bl_operators/connect_to_output.py",
      "start": 45219103,
      "end": 45234980
    }, {
      "filename": "/5.3/scripts/startup/bl_operators/console.py",
      "start": 45234980,
      "end": 45239142
    }, {
      "filename": "/5.3/scripts/startup/bl_operators/constraint.py",
      "start": 45239142,
      "end": 45242666
    }, {
      "filename": "/5.3/scripts/startup/bl_operators/copy_global_transform.py",
      "start": 45242666,
      "end": 45272446
    }, {
      "filename": "/5.3/scripts/startup/bl_operators/file.py",
      "start": 45272446,
      "end": 45282554
    }, {
      "filename": "/5.3/scripts/startup/bl_operators/freestyle.py",
      "start": 45282554,
      "end": 45291305
    }, {
      "filename": "/5.3/scripts/startup/bl_operators/geometry_nodes.py",
      "start": 45291305,
      "end": 45305181
    }, {
      "filename": "/5.3/scripts/startup/bl_operators/grease_pencil.py",
      "start": 45305181,
      "end": 45306983
    }, {
      "filename": "/5.3/scripts/startup/bl_operators/image.py",
      "start": 45306983,
      "end": 45316954
    }, {
      "filename": "/5.3/scripts/startup/bl_operators/image_as_planes.py",
      "start": 45316954,
      "end": 45358944
    }, {
      "filename": "/5.3/scripts/startup/bl_operators/mesh.py",
      "start": 45358944,
      "end": 45360480
    }, {
      "filename": "/5.3/scripts/startup/bl_operators/node.py",
      "start": 45360480,
      "end": 45415172
    }, {
      "filename": "/5.3/scripts/startup/bl_operators/node_editor/node_functions.py",
      "start": 45415172,
      "end": 45418156
    }, {
      "filename": "/5.3/scripts/startup/bl_operators/object.py",
      "start": 45418156,
      "end": 45453990
    }, {
      "filename": "/5.3/scripts/startup/bl_operators/object_align.py",
      "start": 45453990,
      "end": 45465500
    }, {
      "filename": "/5.3/scripts/startup/bl_operators/object_quick_effects.py",
      "start": 45465500,
      "end": 45488732
    }, {
      "filename": "/5.3/scripts/startup/bl_operators/object_randomize_transform.py",
      "start": 45488732,
      "end": 45493812
    }, {
      "filename": "/5.3/scripts/startup/bl_operators/presets.py",
      "start": 45493812,
      "end": 45529942
    }, {
      "filename": "/5.3/scripts/startup/bl_operators/project.py",
      "start": 45529942,
      "end": 45546465
    }, {
      "filename": "/5.3/scripts/startup/bl_operators/render.py",
      "start": 45546465,
      "end": 45547002
    }, {
      "filename": "/5.3/scripts/startup/bl_operators/rigidbody.py",
      "start": 45547002,
      "end": 45557980
    }, {
      "filename": "/5.3/scripts/startup/bl_operators/screen_play_rendered_anim.py",
      "start": 45557980,
      "end": 45568572
    }, {
      "filename": "/5.3/scripts/startup/bl_operators/sequencer.py",
      "start": 45568572,
      "end": 45583953
    }, {
      "filename": "/5.3/scripts/startup/bl_operators/spreadsheet.py",
      "start": 45583953,
      "end": 45585015
    }, {
      "filename": "/5.3/scripts/startup/bl_operators/userpref.py",
      "start": 45585015,
      "end": 45626902
    }, {
      "filename": "/5.3/scripts/startup/bl_operators/uvcalc_follow_active.py",
      "start": 45626902,
      "end": 45636827
    }, {
      "filename": "/5.3/scripts/startup/bl_operators/uvcalc_lightmap.py",
      "start": 45636827,
      "end": 45659790
    }, {
      "filename": "/5.3/scripts/startup/bl_operators/uvcalc_transform.py",
      "start": 45659790,
      "end": 45676350
    }, {
      "filename": "/5.3/scripts/startup/bl_operators/vertexpaint_dirt.py",
      "start": 45676350,
      "end": 45682221
    }, {
      "filename": "/5.3/scripts/startup/bl_operators/view3d.py",
      "start": 45682221,
      "end": 45692633
    }, {
      "filename": "/5.3/scripts/startup/bl_operators/wm.py",
      "start": 45692633,
      "end": 45826778
    }, {
      "filename": "/5.3/scripts/startup/bl_operators/world.py",
      "start": 45826778,
      "end": 45832364
    }, {
      "filename": "/5.3/scripts/startup/bl_ui/__init__.py",
      "start": 45832364,
      "end": 45842544
    }, {
      "filename": "/5.3/scripts/startup/bl_ui/anim.py",
      "start": 45842544,
      "end": 45844154
    }, {
      "filename": "/5.3/scripts/startup/bl_ui/asset_shelf.py",
      "start": 45844154,
      "end": 45845800
    }, {
      "filename": "/5.3/scripts/startup/bl_ui/generic_ui_list.py",
      "start": 45845800,
      "end": 45853316
    }, {
      "filename": "/5.3/scripts/startup/bl_ui/node_add_menu.py",
      "start": 45853316,
      "end": 45873530
    }, {
      "filename": "/5.3/scripts/startup/bl_ui/node_add_menu_compositor.py",
      "start": 45873530,
      "end": 45897012
    }, {
      "filename": "/5.3/scripts/startup/bl_ui/node_add_menu_geometry.py",
      "start": 45897012,
      "end": 45949422
    }, {
      "filename": "/5.3/scripts/startup/bl_ui/node_add_menu_shader.py",
      "start": 45949422,
      "end": 45970160
    }, {
      "filename": "/5.3/scripts/startup/bl_ui/node_add_menu_texture.py",
      "start": 45970160,
      "end": 45975977
    }, {
      "filename": "/5.3/scripts/startup/bl_ui/properties_animviz.py",
      "start": 45975977,
      "end": 45980255
    }, {
      "filename": "/5.3/scripts/startup/bl_ui/properties_collection.py",
      "start": 45980255,
      "end": 45985238
    }, {
      "filename": "/5.3/scripts/startup/bl_ui/properties_constraint.py",
      "start": 45985238,
      "end": 46044381
    }, {
      "filename": "/5.3/scripts/startup/bl_ui/properties_data_armature.py",
      "start": 46044381,
      "end": 46058728
    }, {
      "filename": "/5.3/scripts/startup/bl_ui/properties_data_bone.py",
      "start": 46058728,
      "end": 46080293
    }, {
      "filename": "/5.3/scripts/startup/bl_ui/properties_data_camera.py",
      "start": 46080293,
      "end": 46099987
    }, {
      "filename": "/5.3/scripts/startup/bl_ui/properties_data_curve.py",
      "start": 46099987,
      "end": 46113671
    }, {
      "filename": "/5.3/scripts/startup/bl_ui/properties_data_curves.py",
      "start": 46113671,
      "end": 46119909
    }, {
      "filename": "/5.3/scripts/startup/bl_ui/properties_data_empty.py",
      "start": 46119909,
      "end": 46122674
    }, {
      "filename": "/5.3/scripts/startup/bl_ui/properties_data_grease_pencil.py",
      "start": 46122674,
      "end": 46140931
    }, {
      "filename": "/5.3/scripts/startup/bl_ui/properties_data_lattice.py",
      "start": 46140931,
      "end": 46143684
    }, {
      "filename": "/5.3/scripts/startup/bl_ui/properties_data_light.py",
      "start": 46143684,
      "end": 46153179
    }, {
      "filename": "/5.3/scripts/startup/bl_ui/properties_data_lightprobe.py",
      "start": 46153179,
      "end": 46165775
    }, {
      "filename": "/5.3/scripts/startup/bl_ui/properties_data_mesh.py",
      "start": 46165775,
      "end": 46190652
    }, {
      "filename": "/5.3/scripts/startup/bl_ui/properties_data_metaball.py",
      "start": 46190652,
      "end": 46194277
    }, {
      "filename": "/5.3/scripts/startup/bl_ui/properties_data_modifier.py",
      "start": 46194277,
      "end": 46208206
    }, {
      "filename": "/5.3/scripts/startup/bl_ui/properties_data_pointcloud.py",
      "start": 46208206,
      "end": 46213409
    }, {
      "filename": "/5.3/scripts/startup/bl_ui/properties_data_shaderfx.py",
      "start": 46213409,
      "end": 46214114
    }, {
      "filename": "/5.3/scripts/startup/bl_ui/properties_data_speaker.py",
      "start": 46214114,
      "end": 46218100
    }, {
      "filename": "/5.3/scripts/startup/bl_ui/properties_data_volume.py",
      "start": 46218100,
      "end": 46224520
    }, {
      "filename": "/5.3/scripts/startup/bl_ui/properties_freestyle.py",
      "start": 46224520,
      "end": 46271779
    }, {
      "filename": "/5.3/scripts/startup/bl_ui/properties_grease_pencil_common.py",
      "start": 46271779,
      "end": 46296122
    }, {
      "filename": "/5.3/scripts/startup/bl_ui/properties_mask_common.py",
      "start": 46296122,
      "end": 46310887
    }, {
      "filename": "/5.3/scripts/startup/bl_ui/properties_material.py",
      "start": 46310887,
      "end": 46324772
    }, {
      "filename": "/5.3/scripts/startup/bl_ui/properties_material_gpencil.py",
      "start": 46324772,
      "end": 46335836
    }, {
      "filename": "/5.3/scripts/startup/bl_ui/properties_object.py",
      "start": 46335836,
      "end": 46357852
    }, {
      "filename": "/5.3/scripts/startup/bl_ui/properties_output.py",
      "start": 46357852,
      "end": 46381680
    }, {
      "filename": "/5.3/scripts/startup/bl_ui/properties_paint_common.py",
      "start": 46381680,
      "end": 46456482
    }, {
      "filename": "/5.3/scripts/startup/bl_ui/properties_particle.py",
      "start": 46456482,
      "end": 46528517
    }, {
      "filename": "/5.3/scripts/startup/bl_ui/properties_physics_cloth.py",
      "start": 46528517,
      "end": 46544234
    }, {
      "filename": "/5.3/scripts/startup/bl_ui/properties_physics_common.py",
      "start": 46544234,
      "end": 46555857
    }, {
      "filename": "/5.3/scripts/startup/bl_ui/properties_physics_dynamicpaint.py",
      "start": 46555857,
      "end": 46586248
    }, {
      "filename": "/5.3/scripts/startup/bl_ui/properties_physics_field.py",
      "start": 46586248,
      "end": 46599963
    }, {
      "filename": "/5.3/scripts/startup/bl_ui/properties_physics_fluid.py",
      "start": 46599963,
      "end": 46656286
    }, {
      "filename": "/5.3/scripts/startup/bl_ui/properties_physics_geometry_nodes.py",
      "start": 46656286,
      "end": 46658184
    }, {
      "filename": "/5.3/scripts/startup/bl_ui/properties_physics_rigidbody.py",
      "start": 46658184,
      "end": 46668663
    }, {
      "filename": "/5.3/scripts/startup/bl_ui/properties_physics_rigidbody_constraint.py",
      "start": 46668663,
      "end": 46685597
    }, {
      "filename": "/5.3/scripts/startup/bl_ui/properties_physics_softbody.py",
      "start": 46685597,
      "end": 46698855
    }, {
      "filename": "/5.3/scripts/startup/bl_ui/properties_render.py",
      "start": 46698855,
      "end": 46735888
    }, {
      "filename": "/5.3/scripts/startup/bl_ui/properties_scene.py",
      "start": 46735888,
      "end": 46750682
    }, {
      "filename": "/5.3/scripts/startup/bl_ui/properties_strip.py",
      "start": 46750682,
      "end": 46788292
    }, {
      "filename": "/5.3/scripts/startup/bl_ui/properties_strip_modifier.py",
      "start": 46788292,
      "end": 46789202
    }, {
      "filename": "/5.3/scripts/startup/bl_ui/properties_texture.py",
      "start": 46789202,
      "end": 46818032
    }, {
      "filename": "/5.3/scripts/startup/bl_ui/properties_view_layer.py",
      "start": 46818032,
      "end": 46829685
    }, {
      "filename": "/5.3/scripts/startup/bl_ui/properties_workspace.py",
      "start": 46829685,
      "end": 46836571
    }, {
      "filename": "/5.3/scripts/startup/bl_ui/properties_world.py",
      "start": 46836571,
      "end": 46844359
    }, {
      "filename": "/5.3/scripts/startup/bl_ui/space_clip.py",
      "start": 46844359,
      "end": 46909214
    }, {
      "filename": "/5.3/scripts/startup/bl_ui/space_console.py",
      "start": 46909214,
      "end": 46913915
    }, {
      "filename": "/5.3/scripts/startup/bl_ui/space_dopesheet.py",
      "start": 46913915,
      "end": 46951753
    }, {
      "filename": "/5.3/scripts/startup/bl_ui/space_filebrowser.py",
      "start": 46951753,
      "end": 46986312
    }, {
      "filename": "/5.3/scripts/startup/bl_ui/space_graph.py",
      "start": 46986312,
      "end": 47007803
    }, {
      "filename": "/5.3/scripts/startup/bl_ui/space_image.py",
      "start": 47007803,
      "end": 47065386
    }, {
      "filename": "/5.3/scripts/startup/bl_ui/space_info.py",
      "start": 47065386,
      "end": 47068612
    }, {
      "filename": "/5.3/scripts/startup/bl_ui/space_nla.py",
      "start": 47068612,
      "end": 47081883
    }, {
      "filename": "/5.3/scripts/startup/bl_ui/space_node.py",
      "start": 47081883,
      "end": 47125595
    }, {
      "filename": "/5.3/scripts/startup/bl_ui/space_outliner.py",
      "start": 47125595,
      "end": 47145689
    }, {
      "filename": "/5.3/scripts/startup/bl_ui/space_project.py",
      "start": 47145689,
      "end": 47152044
    }, {
      "filename": "/5.3/scripts/startup/bl_ui/space_properties.py",
      "start": 47152044,
      "end": 47159159
    }, {
      "filename": "/5.3/scripts/startup/bl_ui/space_sequencer.py",
      "start": 47159159,
      "end": 47233751
    }, {
      "filename": "/5.3/scripts/startup/bl_ui/space_spreadsheet.py",
      "start": 47233751,
      "end": 47236109
    }, {
      "filename": "/5.3/scripts/startup/bl_ui/space_statusbar.py",
      "start": 47236109,
      "end": 47236930
    }, {
      "filename": "/5.3/scripts/startup/bl_ui/space_text.py",
      "start": 47236930,
      "end": 47250518
    }, {
      "filename": "/5.3/scripts/startup/bl_ui/space_time.py",
      "start": 47250518,
      "end": 47263621
    }, {
      "filename": "/5.3/scripts/startup/bl_ui/space_toolsystem_common.py",
      "start": 47263621,
      "end": 47309192
    }, {
      "filename": "/5.3/scripts/startup/bl_ui/space_toolsystem_toolbar.py",
      "start": 47309192,
      "end": 47444904
    }, {
      "filename": "/5.3/scripts/startup/bl_ui/space_topbar.py",
      "start": 47444904,
      "end": 47474191
    }, {
      "filename": "/5.3/scripts/startup/bl_ui/space_userpref.py",
      "start": 47474191,
      "end": 47582840
    }, {
      "filename": "/5.3/scripts/startup/bl_ui/space_view3d.py",
      "start": 47582840,
      "end": 47911817
    }, {
      "filename": "/5.3/scripts/startup/bl_ui/space_view3d_sidebar.py",
      "start": 47911817,
      "end": 47919188
    }, {
      "filename": "/5.3/scripts/startup/bl_ui/space_view3d_toolbar.py",
      "start": 47919188,
      "end": 48002861
    }, {
      "filename": "/5.3/scripts/startup/bl_ui/utils.py",
      "start": 48002861,
      "end": 48003793
    }, {
      "filename": "/5.3/scripts/startup/keyingsets_builtins.py",
      "start": 48003793,
      "end": 48027335
    }, {
      "filename": "/5.3/scripts/startup/nodeitems_builtins.py",
      "start": 48027335,
      "end": 48028685
    }, {
      "filename": "/5.3/scripts/templates_osl/advanced_camera.osl",
      "start": 48028685,
      "end": 48031203
    }, {
      "filename": "/5.3/scripts/templates_osl/basic_camera.osl",
      "start": 48031203,
      "end": 48031793
    }, {
      "filename": "/5.3/scripts/templates_osl/basic_shader.osl",
      "start": 48031793,
      "end": 48032041
    }, {
      "filename": "/5.3/scripts/templates_osl/cubemap_camera.osl",
      "start": 48032041,
      "end": 48033192
    }, {
      "filename": "/5.3/scripts/templates_osl/empty_shader.osl",
      "start": 48033192,
      "end": 48033213
    }, {
      "filename": "/5.3/scripts/templates_osl/gabor_noise.osl",
      "start": 48033213,
      "end": 48033658
    }, {
      "filename": "/5.3/scripts/templates_osl/lyapunov_texture.osl",
      "start": 48033658,
      "end": 48037548
    }, {
      "filename": "/5.3/scripts/templates_osl/noise.osl",
      "start": 48037548,
      "end": 48038070
    }, {
      "filename": "/5.3/scripts/templates_osl/ramp_closure.osl",
      "start": 48038070,
      "end": 48038599
    }, {
      "filename": "/5.3/scripts/templates_py/Gizmo/custom_geometry.py",
      "start": 48038599,
      "end": 48044462
    }, {
      "filename": "/5.3/scripts/templates_py/Gizmo/operator.py",
      "start": 48044462,
      "end": 48050826
    }, {
      "filename": "/5.3/scripts/templates_py/Gizmo/operator_target.py",
      "start": 48050826,
      "end": 48052171
    }, {
      "filename": "/5.3/scripts/templates_py/Gizmo/simple_2d.py",
      "start": 48052171,
      "end": 48053829
    }, {
      "filename": "/5.3/scripts/templates_py/Gizmo/simple_3d.py",
      "start": 48053829,
      "end": 48055095
    }, {
      "filename": "/5.3/scripts/templates_py/Operator/file_export.py",
      "start": 48055095,
      "end": 48057417
    }, {
      "filename": "/5.3/scripts/templates_py/Operator/file_import.py",
      "start": 48057417,
      "end": 48059757
    }, {
      "filename": "/5.3/scripts/templates_py/Operator/mesh_add.py",
      "start": 48059757,
      "end": 48062367
    }, {
      "filename": "/5.3/scripts/templates_py/Operator/mesh_uv.py",
      "start": 48062367,
      "end": 48063700
    }, {
      "filename": "/5.3/scripts/templates_py/Operator/modal.py",
      "start": 48063700,
      "end": 48065402
    }, {
      "filename": "/5.3/scripts/templates_py/Operator/modal_draw.py",
      "start": 48065402,
      "end": 48068115
    }, {
      "filename": "/5.3/scripts/templates_py/Operator/modal_timer.py",
      "start": 48068115,
      "end": 48069941
    }, {
      "filename": "/5.3/scripts/templates_py/Operator/modal_view3d.py",
      "start": 48069941,
      "end": 48072260
    }, {
      "filename": "/5.3/scripts/templates_py/Operator/modal_view3d_raycast.py",
      "start": 48072260,
      "end": 48076296
    }, {
      "filename": "/5.3/scripts/templates_py/Operator/node.py",
      "start": 48076296,
      "end": 48078036
    }, {
      "filename": "/5.3/scripts/templates_py/Operator/simple.py",
      "start": 48078036,
      "end": 48079e3
    }, {
      "filename": "/5.3/scripts/templates_py/UI/asset_shelf.py",
      "start": 48079e3,
      "end": 48079692
    }, {
      "filename": "/5.3/scripts/templates_py/UI/list.py",
      "start": 48079692,
      "end": 48081659
    }, {
      "filename": "/5.3/scripts/templates_py/UI/list_generic.py",
      "start": 48081659,
      "end": 48082694
    }, {
      "filename": "/5.3/scripts/templates_py/UI/list_simple.py",
      "start": 48082694,
      "end": 48085842
    }, {
      "filename": "/5.3/scripts/templates_py/UI/menu.py",
      "start": 48085842,
      "end": 48087055
    }, {
      "filename": "/5.3/scripts/templates_py/UI/menu_simple.py",
      "start": 48087055,
      "end": 48087626
    }, {
      "filename": "/5.3/scripts/templates_py/UI/panel.py",
      "start": 48087626,
      "end": 48089467
    }, {
      "filename": "/5.3/scripts/templates_py/UI/panel_simple.py",
      "start": 48089467,
      "end": 48090304
    }, {
      "filename": "/5.3/scripts/templates_py/UI/pie_menu.py",
      "start": 48090304,
      "end": 48091073
    }, {
      "filename": "/5.3/scripts/templates_py/UI/previews_custom_icon.py",
      "start": 48091073,
      "end": 48093427
    }, {
      "filename": "/5.3/scripts/templates_py/UI/previews_dynamic_enum.py",
      "start": 48093427,
      "end": 48097633
    }, {
      "filename": "/5.3/scripts/templates_py/UI/tool_simple.py",
      "start": 48097633,
      "end": 48100487
    }, {
      "filename": "/5.3/scripts/templates_py/addon_add_object.py",
      "start": 48100487,
      "end": 48102775
    }, {
      "filename": "/5.3/scripts/templates_py/background_job.py",
      "start": 48102775,
      "end": 48106719
    }, {
      "filename": "/5.3/scripts/templates_py/batch_export.py",
      "start": 48106719,
      "end": 48107637
    }, {
      "filename": "/5.3/scripts/templates_py/bmesh_simple.py",
      "start": 48107637,
      "end": 48108077
    }, {
      "filename": "/5.3/scripts/templates_py/bmesh_simple_editmode.py",
      "start": 48108077,
      "end": 48108517
    }, {
      "filename": "/5.3/scripts/templates_py/builtin_keyingset.py",
      "start": 48108517,
      "end": 48109521
    }, {
      "filename": "/5.3/scripts/templates_py/custom_nodes.py",
      "start": 48109521,
      "end": 48115262
    }, {
      "filename": "/5.3/scripts/templates_py/driver_functions.py",
      "start": 48115262,
      "end": 48116155
    }, {
      "filename": "/5.3/scripts/templates_py/external_script_stub.py",
      "start": 48116155,
      "end": 48116594
    }, {
      "filename": "/5.3/scripts/templates_py/image_processing.py",
      "start": 48116594,
      "end": 48117683
    }, {
      "filename": "/5.3/scripts/templates_toml/blender_manifest.toml",
      "start": 48117683,
      "end": 48120582
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/LICENSE.txt",
      "start": 48120582,
      "end": 48134391
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/__future__.py",
      "start": 48134391,
      "end": 48139609
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/__hello__.py",
      "start": 48139609,
      "end": 48139836
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/__phello__/__init__.py",
      "start": 48139836,
      "end": 48139933
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/__phello__/spam.py",
      "start": 48139933,
      "end": 48140030
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/_aix_support.py",
      "start": 48140030,
      "end": 48144051
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/_android_support.py",
      "start": 48144051,
      "end": 48151468
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/_apple_support.py",
      "start": 48151468,
      "end": 48153724
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/_collections_abc.py",
      "start": 48153724,
      "end": 48186334
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/_colorize.py",
      "start": 48186334,
      "end": 48189402
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/_compat_pickle.py",
      "start": 48189402,
      "end": 48198137
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/_compression.py",
      "start": 48198137,
      "end": 48203818
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/_ios_support.py",
      "start": 48203818,
      "end": 48206490
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/_markupbase.py",
      "start": 48206490,
      "end": 48221143
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/_opcode_metadata.py",
      "start": 48221143,
      "end": 48230408
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/_osx_support.py",
      "start": 48230408,
      "end": 48252431
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/_py_abc.py",
      "start": 48252431,
      "end": 48258620
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/_pydatetime.py",
      "start": 48258620,
      "end": 48350603
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/_pydecimal.py",
      "start": 48350603,
      "end": 48578129
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/_pyio.py",
      "start": 48578129,
      "end": 48671991
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/_pylong.py",
      "start": 48671991,
      "end": 48683821
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/_pyrepl/__init__.py",
      "start": 48683821,
      "end": 48684746
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/_pyrepl/__main__.py",
      "start": 48684746,
      "end": 48685168
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/_pyrepl/_minimal_curses.py",
      "start": 48685168,
      "end": 48687012
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/_pyrepl/_threading_handler.py",
      "start": 48687012,
      "end": 48689182
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/_pyrepl/base_eventqueue.py",
      "start": 48689182,
      "end": 48693022
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/_pyrepl/commands.py",
      "start": 48693022,
      "end": 48705317
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/_pyrepl/completing_reader.py",
      "start": 48705317,
      "end": 48715367
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/_pyrepl/console.py",
      "start": 48715367,
      "end": 48722233
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/_pyrepl/curses.py",
      "start": 48722233,
      "end": 48723474
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/_pyrepl/fancy_termios.py",
      "start": 48723474,
      "end": 48726040
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/_pyrepl/historical_reader.py",
      "start": 48726040,
      "end": 48739280
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/_pyrepl/input.py",
      "start": 48739280,
      "end": 48743059
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/_pyrepl/keymap.py",
      "start": 48743059,
      "end": 48749519
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/_pyrepl/main.py",
      "start": 48749519,
      "end": 48751457
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/_pyrepl/mypy.ini",
      "start": 48751457,
      "end": 48752327
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/_pyrepl/pager.py",
      "start": 48752327,
      "end": 48758142
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/_pyrepl/reader.py",
      "start": 48758142,
      "end": 48785854
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/_pyrepl/readline.py",
      "start": 48785854,
      "end": 48806075
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/_pyrepl/simple_interact.py",
      "start": 48806075,
      "end": 48811872
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/_pyrepl/trace.py",
      "start": 48811872,
      "end": 48812305
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/_pyrepl/types.py",
      "start": 48812305,
      "end": 48812659
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/_pyrepl/unix_console.py",
      "start": 48812659,
      "end": 48839421
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/_pyrepl/unix_eventqueue.py",
      "start": 48839421,
      "end": 48841945
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/_pyrepl/utils.py",
      "start": 48841945,
      "end": 48844389
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/_pyrepl/windows_console.py",
      "start": 48844389,
      "end": 48866086
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/_pyrepl/windows_eventqueue.py",
      "start": 48866086,
      "end": 48867077
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/_sitebuiltins.py",
      "start": 48867077,
      "end": 48869776
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/_strptime.py",
      "start": 48869776,
      "end": 48904510
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/_sysconfigdata__emscripten_wasm32-emscripten.py",
      "start": 48904510,
      "end": 48957528
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/_threading_local.py",
      "start": 48957528,
      "end": 48961891
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/_weakrefset.py",
      "start": 48961891,
      "end": 48967784
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/abc.py",
      "start": 48967784,
      "end": 48974322
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/antigravity.py",
      "start": 48974322,
      "end": 48974822
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/argparse.py",
      "start": 48974822,
      "end": 49077748
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/ast.py",
      "start": 49077748,
      "end": 49143087
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/asyncio/__init__.py",
      "start": 49143087,
      "end": 49144307
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/asyncio/__main__.py",
      "start": 49144307,
      "end": 49150588
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/asyncio/base_events.py",
      "start": 49150588,
      "end": 49231856
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/asyncio/base_futures.py",
      "start": 49231856,
      "end": 49233830
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/asyncio/base_subprocess.py",
      "start": 49233830,
      "end": 49244159
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/asyncio/base_tasks.py",
      "start": 49244159,
      "end": 49246831
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/asyncio/constants.py",
      "start": 49246831,
      "end": 49248244
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/asyncio/coroutines.py",
      "start": 49248244,
      "end": 49251586
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/asyncio/events.py",
      "start": 49251586,
      "end": 49281372
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/asyncio/exceptions.py",
      "start": 49281372,
      "end": 49283124
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/asyncio/format_helpers.py",
      "start": 49283124,
      "end": 49285851
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/asyncio/futures.py",
      "start": 49285851,
      "end": 49300040
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/asyncio/locks.py",
      "start": 49300040,
      "end": 49320620
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/asyncio/log.py",
      "start": 49320620,
      "end": 49320744
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/asyncio/mixins.py",
      "start": 49320744,
      "end": 49321225
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/asyncio/proactor_events.py",
      "start": 49321225,
      "end": 49354754
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/asyncio/protocols.py",
      "start": 49354754,
      "end": 49361711
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/asyncio/queues.py",
      "start": 49361711,
      "end": 49371848
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/asyncio/runners.py",
      "start": 49371848,
      "end": 49379078
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/asyncio/selector_events.py",
      "start": 49379078,
      "end": 49427701
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/asyncio/sslproto.py",
      "start": 49427701,
      "end": 49459570
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/asyncio/staggered.py",
      "start": 49459570,
      "end": 49466647
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/asyncio/streams.py",
      "start": 49466647,
      "end": 49495128
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/asyncio/subprocess.py",
      "start": 49495128,
      "end": 49502865
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/asyncio/taskgroups.py",
      "start": 49502865,
      "end": 49512914
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/asyncio/tasks.py",
      "start": 49512914,
      "end": 49552671
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/asyncio/threads.py",
      "start": 49552671,
      "end": 49553461
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/asyncio/timeouts.py",
      "start": 49553461,
      "end": 49559523
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/asyncio/transports.py",
      "start": 49559523,
      "end": 49570331
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/asyncio/trsock.py",
      "start": 49570331,
      "end": 49572806
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/asyncio/unix_events.py",
      "start": 49572806,
      "end": 49627222
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/asyncio/windows_events.py",
      "start": 49627222,
      "end": 49659852
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/asyncio/windows_utils.py",
      "start": 49659852,
      "end": 49665294
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/base64.py",
      "start": 49665294,
      "end": 49687339
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/bdb.py",
      "start": 49687339,
      "end": 49723438
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/bisect.py",
      "start": 49723438,
      "end": 49726861
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/bz2.py",
      "start": 49726861,
      "end": 49738830
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/cProfile.py",
      "start": 49738830,
      "end": 49745454
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/calendar.py",
      "start": 49745454,
      "end": 49771531
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/cmd.py",
      "start": 49771531,
      "end": 49786847
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/code.py",
      "start": 49786847,
      "end": 49800017
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/codecs.py",
      "start": 49800017,
      "end": 49836995
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/codeop.py",
      "start": 49836995,
      "end": 49842823
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/collections/__init__.py",
      "start": 49842823,
      "end": 49895457
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/colorsys.py",
      "start": 49895457,
      "end": 49899519
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/compileall.py",
      "start": 49899519,
      "end": 49920184
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/concurrent/__init__.py",
      "start": 49920184,
      "end": 49920222
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/concurrent/futures/__init__.py",
      "start": 49920222,
      "end": 49921805
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/concurrent/futures/_base.py",
      "start": 49921805,
      "end": 49944650
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/concurrent/futures/process.py",
      "start": 49944650,
      "end": 49980118
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/concurrent/futures/thread.py",
      "start": 49980118,
      "end": 49989080
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/configparser.py",
      "start": 49989080,
      "end": 50042911
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/contextlib.py",
      "start": 50042911,
      "end": 50070712
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/contextvars.py",
      "start": 50070712,
      "end": 50070841
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/copy.py",
      "start": 50070841,
      "end": 50079816
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/copyreg.py",
      "start": 50079816,
      "end": 50087430
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/csv.py",
      "start": 50087430,
      "end": 50106608
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/ctypes/__init__.py",
      "start": 50106608,
      "end": 50126113
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/ctypes/_aix.py",
      "start": 50126113,
      "end": 50138618
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/ctypes/_endian.py",
      "start": 50138618,
      "end": 50141175
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/ctypes/macholib/README.ctypes",
      "start": 50141175,
      "end": 50141471
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/ctypes/macholib/__init__.py",
      "start": 50141471,
      "end": 50141625
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/ctypes/macholib/dyld.py",
      "start": 50141625,
      "end": 50146649
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/ctypes/macholib/dylib.py",
      "start": 50146649,
      "end": 50147609
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/ctypes/macholib/fetch_macholib",
      "start": 50147609,
      "end": 50147693
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/ctypes/macholib/fetch_macholib.bat",
      "start": 50147693,
      "end": 50147768
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/ctypes/macholib/framework.py",
      "start": 50147768,
      "end": 50148873
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/ctypes/util.py",
      "start": 50148873,
      "end": 50163125
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/ctypes/wintypes.py",
      "start": 50163125,
      "end": 50168754
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/curses/__init__.py",
      "start": 50168754,
      "end": 50172123
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/curses/ascii.py",
      "start": 50172123,
      "end": 50174666
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/curses/has_key.py",
      "start": 50174666,
      "end": 50180300
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/curses/panel.py",
      "start": 50180300,
      "end": 50180387
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/curses/textpad.py",
      "start": 50180387,
      "end": 50188141
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/dataclasses.py",
      "start": 50188141,
      "end": 50252686
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/datetime.py",
      "start": 50252686,
      "end": 50252954
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/dbm/__init__.py",
      "start": 50252954,
      "end": 50258978
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/dbm/dumb.py",
      "start": 50258978,
      "end": 50270689
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/dbm/gnu.py",
      "start": 50270689,
      "end": 50270761
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/dbm/ndbm.py",
      "start": 50270761,
      "end": 50270831
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/dbm/sqlite3.py",
      "start": 50270831,
      "end": 50275104
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/decimal.py",
      "start": 50275104,
      "end": 50277902
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/difflib.py",
      "start": 50277902,
      "end": 50361269
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/dis.py",
      "start": 50361269,
      "end": 50402231
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/doctest.py",
      "start": 50402231,
      "end": 50511645
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/email/__init__.py",
      "start": 50511645,
      "end": 50513409
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/email/_encoded_words.py",
      "start": 50513409,
      "end": 50521950
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/email/_header_value_parser.py",
      "start": 50521950,
      "end": 50634723
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/email/_parseaddr.py",
      "start": 50634723,
      "end": 50652848
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/email/_policybase.py",
      "start": 50652848,
      "end": 50668397
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/email/architecture.rst",
      "start": 50668397,
      "end": 50677958
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/email/base64mime.py",
      "start": 50677958,
      "end": 50681509
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/email/charset.py",
      "start": 50681509,
      "end": 50698572
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/email/contentmanager.py",
      "start": 50698572,
      "end": 50709166
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/email/encoders.py",
      "start": 50709166,
      "end": 50710944
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/email/errors.py",
      "start": 50710944,
      "end": 50714758
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/email/feedparser.py",
      "start": 50714758,
      "end": 50737627
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/email/generator.py",
      "start": 50737627,
      "end": 50759044
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/email/header.py",
      "start": 50759044,
      "end": 50783508
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/email/headerregistry.py",
      "start": 50783508,
      "end": 50804752
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/email/iterators.py",
      "start": 50804752,
      "end": 50806881
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/email/message.py",
      "start": 50806881,
      "end": 50855323
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/email/mime/__init__.py",
      "start": 50855323,
      "end": 50855323
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/email/mime/application.py",
      "start": 50855323,
      "end": 50856644
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/email/mime/audio.py",
      "start": 50856644,
      "end": 50859648
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/email/mime/base.py",
      "start": 50859648,
      "end": 50860562
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/email/mime/image.py",
      "start": 50860562,
      "end": 50864288
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/email/mime/message.py",
      "start": 50864288,
      "end": 50865603
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/email/mime/multipart.py",
      "start": 50865603,
      "end": 50867222
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/email/mime/nonmultipart.py",
      "start": 50867222,
      "end": 50867911
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/email/mime/text.py",
      "start": 50867911,
      "end": 50869305
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/email/parser.py",
      "start": 50869305,
      "end": 50874280
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/email/policy.py",
      "start": 50874280,
      "end": 50884894
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/email/quoprimime.py",
      "start": 50884894,
      "end": 50894758
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/email/utils.py",
      "start": 50894758,
      "end": 50911373
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/__init__.py",
      "start": 50911373,
      "end": 50917393
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/aliases.py",
      "start": 50917393,
      "end": 50933106
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/ascii.py",
      "start": 50933106,
      "end": 50934354
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/base64_codec.py",
      "start": 50934354,
      "end": 50935887
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/big5.py",
      "start": 50935887,
      "end": 50936906
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/big5hkscs.py",
      "start": 50936906,
      "end": 50937945
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/bz2_codec.py",
      "start": 50937945,
      "end": 50940194
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/charmap.py",
      "start": 50940194,
      "end": 50942278
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/cp037.py",
      "start": 50942278,
      "end": 50955399
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/cp1006.py",
      "start": 50955399,
      "end": 50968967
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/cp1026.py",
      "start": 50968967,
      "end": 50982080
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/cp1125.py",
      "start": 50982080,
      "end": 51016677
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/cp1140.py",
      "start": 51016677,
      "end": 51029782
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/cp1250.py",
      "start": 51029782,
      "end": 51043468
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/cp1251.py",
      "start": 51043468,
      "end": 51056829
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/cp1252.py",
      "start": 51056829,
      "end": 51070340
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/cp1253.py",
      "start": 51070340,
      "end": 51083434
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/cp1254.py",
      "start": 51083434,
      "end": 51096936
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/cp1255.py",
      "start": 51096936,
      "end": 51109402
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/cp1256.py",
      "start": 51109402,
      "end": 51122216
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/cp1257.py",
      "start": 51122216,
      "end": 51135590
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/cp1258.py",
      "start": 51135590,
      "end": 51148954
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/cp273.py",
      "start": 51148954,
      "end": 51163086
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/cp424.py",
      "start": 51163086,
      "end": 51175141
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/cp437.py",
      "start": 51175141,
      "end": 51209705
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/cp500.py",
      "start": 51209705,
      "end": 51222826
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/cp720.py",
      "start": 51222826,
      "end": 51236512
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/cp737.py",
      "start": 51236512,
      "end": 51271193
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/cp775.py",
      "start": 51271193,
      "end": 51305669
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/cp850.py",
      "start": 51305669,
      "end": 51339774
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/cp852.py",
      "start": 51339774,
      "end": 51374776
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/cp855.py",
      "start": 51374776,
      "end": 51408626
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/cp856.py",
      "start": 51408626,
      "end": 51421049
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/cp857.py",
      "start": 51421049,
      "end": 51454957
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/cp858.py",
      "start": 51454957,
      "end": 51488972
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/cp860.py",
      "start": 51488972,
      "end": 51523653
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/cp861.py",
      "start": 51523653,
      "end": 51558286
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/cp862.py",
      "start": 51558286,
      "end": 51591656
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/cp863.py",
      "start": 51591656,
      "end": 51625908
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/cp864.py",
      "start": 51625908,
      "end": 51659571
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/cp865.py",
      "start": 51659571,
      "end": 51694189
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/cp866.py",
      "start": 51694189,
      "end": 51728585
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/cp869.py",
      "start": 51728585,
      "end": 51761550
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/cp874.py",
      "start": 51761550,
      "end": 51774145
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/cp875.py",
      "start": 51774145,
      "end": 51786999
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/cp932.py",
      "start": 51786999,
      "end": 51788022
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/cp949.py",
      "start": 51788022,
      "end": 51789045
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/cp950.py",
      "start": 51789045,
      "end": 51790068
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/euc_jis_2004.py",
      "start": 51790068,
      "end": 51791119
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/euc_jisx0213.py",
      "start": 51791119,
      "end": 51792170
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/euc_jp.py",
      "start": 51792170,
      "end": 51793197
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/euc_kr.py",
      "start": 51793197,
      "end": 51794224
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/gb18030.py",
      "start": 51794224,
      "end": 51795255
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/gb2312.py",
      "start": 51795255,
      "end": 51796282
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/gbk.py",
      "start": 51796282,
      "end": 51797297
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/hex_codec.py",
      "start": 51797297,
      "end": 51798805
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/hp_roman8.py",
      "start": 51798805,
      "end": 51812280
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/hz.py",
      "start": 51812280,
      "end": 51813291
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/idna.py",
      "start": 51813291,
      "end": 51826539
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/iso2022_jp.py",
      "start": 51826539,
      "end": 51827592
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/iso2022_jp_1.py",
      "start": 51827592,
      "end": 51828653
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/iso2022_jp_2.py",
      "start": 51828653,
      "end": 51829714
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/iso2022_jp_2004.py",
      "start": 51829714,
      "end": 51830787
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/iso2022_jp_3.py",
      "start": 51830787,
      "end": 51831848
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/iso2022_jp_ext.py",
      "start": 51831848,
      "end": 51832917
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/iso2022_kr.py",
      "start": 51832917,
      "end": 51833970
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/iso8859_1.py",
      "start": 51833970,
      "end": 51847146
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/iso8859_10.py",
      "start": 51847146,
      "end": 51860735
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/iso8859_11.py",
      "start": 51860735,
      "end": 51873070
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/iso8859_13.py",
      "start": 51873070,
      "end": 51886341
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/iso8859_14.py",
      "start": 51886341,
      "end": 51899993
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/iso8859_15.py",
      "start": 51899993,
      "end": 51913205
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/iso8859_16.py",
      "start": 51913205,
      "end": 51926762
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/iso8859_2.py",
      "start": 51926762,
      "end": 51940166
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/iso8859_3.py",
      "start": 51940166,
      "end": 51953255
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/iso8859_4.py",
      "start": 51953255,
      "end": 51966631
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/iso8859_5.py",
      "start": 51966631,
      "end": 51979646
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/iso8859_6.py",
      "start": 51979646,
      "end": 51990479
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/iso8859_7.py",
      "start": 51990479,
      "end": 52003323
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/iso8859_8.py",
      "start": 52003323,
      "end": 52014359
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/iso8859_9.py",
      "start": 52014359,
      "end": 52027515
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/johab.py",
      "start": 52027515,
      "end": 52028538
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/koi8_r.py",
      "start": 52028538,
      "end": 52042317
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/koi8_t.py",
      "start": 52042317,
      "end": 52055510
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/koi8_u.py",
      "start": 52055510,
      "end": 52069272
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/kz1048.py",
      "start": 52069272,
      "end": 52082995
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/latin_1.py",
      "start": 52082995,
      "end": 52084259
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/mac_arabic.py",
      "start": 52084259,
      "end": 52120726
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/mac_croatian.py",
      "start": 52120726,
      "end": 52134359
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/mac_cyrillic.py",
      "start": 52134359,
      "end": 52147813
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/mac_farsi.py",
      "start": 52147813,
      "end": 52162983
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/mac_greek.py",
      "start": 52162983,
      "end": 52176704
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/mac_iceland.py",
      "start": 52176704,
      "end": 52190202
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/mac_latin2.py",
      "start": 52190202,
      "end": 52204320
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/mac_roman.py",
      "start": 52204320,
      "end": 52217800
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/mac_romanian.py",
      "start": 52217800,
      "end": 52231461
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/mac_turkish.py",
      "start": 52231461,
      "end": 52244974
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/mbcs.py",
      "start": 52244974,
      "end": 52246185
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/oem.py",
      "start": 52246185,
      "end": 52247204
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/palmos.py",
      "start": 52247204,
      "end": 52260756
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/ptcp154.py",
      "start": 52260756,
      "end": 52274771
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/punycode.py",
      "start": 52274771,
      "end": 52282396
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/quopri_codec.py",
      "start": 52282396,
      "end": 52283921
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/raw_unicode_escape.py",
      "start": 52283921,
      "end": 52285253
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/rot_13.py",
      "start": 52285253,
      "end": 52287701
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/shift_jis.py",
      "start": 52287701,
      "end": 52288740
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/shift_jis_2004.py",
      "start": 52288740,
      "end": 52289799
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/shift_jisx0213.py",
      "start": 52289799,
      "end": 52290858
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/tis_620.py",
      "start": 52290858,
      "end": 52303158
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/undefined.py",
      "start": 52303158,
      "end": 52304459
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/unicode_escape.py",
      "start": 52304459,
      "end": 52305763
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/utf_16.py",
      "start": 52305763,
      "end": 52311043
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/utf_16_be.py",
      "start": 52311043,
      "end": 52312080
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/utf_16_le.py",
      "start": 52312080,
      "end": 52313117
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/utf_32.py",
      "start": 52313117,
      "end": 52318292
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/utf_32_be.py",
      "start": 52318292,
      "end": 52319222
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/utf_32_le.py",
      "start": 52319222,
      "end": 52320152
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/utf_7.py",
      "start": 52320152,
      "end": 52321098
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/utf_8.py",
      "start": 52321098,
      "end": 52322103
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/utf_8_sig.py",
      "start": 52322103,
      "end": 52326236
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/uu_codec.py",
      "start": 52326236,
      "end": 52329087
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/encodings/zlib_codec.py",
      "start": 52329087,
      "end": 52331291
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/enum.py",
      "start": 52331291,
      "end": 52416910
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/filecmp.py",
      "start": 52416910,
      "end": 52427562
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/fileinput.py",
      "start": 52427562,
      "end": 52443279
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/fnmatch.py",
      "start": 52443279,
      "end": 52449459
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/fractions.py",
      "start": 52449459,
      "end": 52489549
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/ftplib.py",
      "start": 52489549,
      "end": 52524284
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/functools.py",
      "start": 52524284,
      "end": 52563346
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/genericpath.py",
      "start": 52563346,
      "end": 52569593
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/getopt.py",
      "start": 52569593,
      "end": 52577081
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/getpass.py",
      "start": 52577081,
      "end": 52583314
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/gettext.py",
      "start": 52583314,
      "end": 52604848
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/glob.py",
      "start": 52604848,
      "end": 52625769
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/graphlib.py",
      "start": 52625769,
      "end": 52635417
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/gzip.py",
      "start": 52635417,
      "end": 52660050
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/hashlib.py",
      "start": 52660050,
      "end": 52669496
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/heapq.py",
      "start": 52669496,
      "end": 52692520
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/hmac.py",
      "start": 52692520,
      "end": 52700279
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/html/__init__.py",
      "start": 52700279,
      "end": 52705054
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/html/entities.py",
      "start": 52705054,
      "end": 52780566
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/html/parser.py",
      "start": 52780566,
      "end": 52802300
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/http/__init__.py",
      "start": 52802300,
      "end": 52810746
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/http/client.py",
      "start": 52810746,
      "end": 52868789
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/http/cookiejar.py",
      "start": 52868789,
      "end": 52946305
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/http/cookies.py",
      "start": 52946305,
      "end": 52967873
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/http/server.py",
      "start": 52967873,
      "end": 53017731
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/imaplib.py",
      "start": 53017731,
      "end": 53072071
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/importlib/__init__.py",
      "start": 53072071,
      "end": 53076838
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/importlib/_abc.py",
      "start": 53076838,
      "end": 53078192
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/importlib/_bootstrap.py",
      "start": 53078192,
      "end": 53135752
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/importlib/_bootstrap_external.py",
      "start": 53135752,
      "end": 53208993
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/importlib/abc.py",
      "start": 53208993,
      "end": 53216652
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/importlib/machinery.py",
      "start": 53216652,
      "end": 53217586
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/importlib/metadata/__init__.py",
      "start": 53217586,
      "end": 53251677
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/importlib/metadata/_adapters.py",
      "start": 53251677,
      "end": 53254084
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/importlib/metadata/_collections.py",
      "start": 53254084,
      "end": 53254827
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/importlib/metadata/_functools.py",
      "start": 53254827,
      "end": 53257722
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/importlib/metadata/_itertools.py",
      "start": 53257722,
      "end": 53259790
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/importlib/metadata/_meta.py",
      "start": 53259790,
      "end": 53261591
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/importlib/metadata/_text.py",
      "start": 53261591,
      "end": 53263757
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/importlib/metadata/diagnose.py",
      "start": 53263757,
      "end": 53264136
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/importlib/readers.py",
      "start": 53264136,
      "end": 53264463
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/importlib/resources/__init__.py",
      "start": 53264463,
      "end": 53265166
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/importlib/resources/_adapters.py",
      "start": 53265166,
      "end": 53269648
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/importlib/resources/_common.py",
      "start": 53269648,
      "end": 53275264
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/importlib/resources/_functional.py",
      "start": 53275264,
      "end": 53277915
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/importlib/resources/_itertools.py",
      "start": 53277915,
      "end": 53279192
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/importlib/resources/abc.py",
      "start": 53279192,
      "end": 53284395
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/importlib/resources/readers.py",
      "start": 53284395,
      "end": 53290638
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/importlib/resources/simple.py",
      "start": 53290638,
      "end": 53293228
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/importlib/simple.py",
      "start": 53293228,
      "end": 53293582
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/importlib/util.py",
      "start": 53293582,
      "end": 53304781
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/inspect.py",
      "start": 53304781,
      "end": 53433719
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/io.py",
      "start": 53433719,
      "end": 53437301
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/ipaddress.py",
      "start": 53437301,
      "end": 53518950
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/json/__init__.py",
      "start": 53518950,
      "end": 53533031
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/json/decoder.py",
      "start": 53533031,
      "end": 53545904
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/json/encoder.py",
      "start": 53545904,
      "end": 53562103
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/json/scanner.py",
      "start": 53562103,
      "end": 53564537
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/json/tool.py",
      "start": 53564537,
      "end": 53567907
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/keyword.py",
      "start": 53567907,
      "end": 53568980
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/linecache.py",
      "start": 53568980,
      "end": 53576468
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/locale.py",
      "start": 53576468,
      "end": 53655501
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/logging/__init__.py",
      "start": 53655501,
      "end": 53739334
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/logging/config.py",
      "start": 53739334,
      "end": 53781812
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/logging/handlers.py",
      "start": 53781812,
      "end": 53844336
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/lzma.py",
      "start": 53844336,
      "end": 53857735
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/mailbox.py",
      "start": 53857735,
      "end": 53939266
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/mimetypes.py",
      "start": 53939266,
      "end": 53963117
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/modulefinder.py",
      "start": 53963117,
      "end": 53986909
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/multiprocessing/__init__.py",
      "start": 53986909,
      "end": 53987825
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/multiprocessing/connection.py",
      "start": 53987825,
      "end": 54030799
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/multiprocessing/context.py",
      "start": 54030799,
      "end": 54042871
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/multiprocessing/dummy/__init__.py",
      "start": 54042871,
      "end": 54045932
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/multiprocessing/dummy/connection.py",
      "start": 54045932,
      "end": 54047530
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/multiprocessing/forkserver.py",
      "start": 54047530,
      "end": 54060884
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/multiprocessing/heap.py",
      "start": 54060884,
      "end": 54072510
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/multiprocessing/managers.py",
      "start": 54072510,
      "end": 54120712
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/multiprocessing/pool.py",
      "start": 54120712,
      "end": 54153480
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/multiprocessing/popen_fork.py",
      "start": 54153480,
      "end": 54155996
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/multiprocessing/popen_forkserver.py",
      "start": 54155996,
      "end": 54158226
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/multiprocessing/popen_spawn_posix.py",
      "start": 54158226,
      "end": 54160369
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/multiprocessing/popen_spawn_win32.py",
      "start": 54160369,
      "end": 54165004
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/multiprocessing/process.py",
      "start": 54165004,
      "end": 54177059
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/multiprocessing/queues.py",
      "start": 54177059,
      "end": 54189727
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/multiprocessing/reduction.py",
      "start": 54189727,
      "end": 54199239
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/multiprocessing/resource_sharer.py",
      "start": 54199239,
      "end": 54204384
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/multiprocessing/resource_tracker.py",
      "start": 54204384,
      "end": 54219631
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/multiprocessing/shared_memory.py",
      "start": 54219631,
      "end": 54238542
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/multiprocessing/sharedctypes.py",
      "start": 54238542,
      "end": 54244848
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/multiprocessing/spawn.py",
      "start": 54244848,
      "end": 54254507
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/multiprocessing/synchronize.py",
      "start": 54254507,
      "end": 54266779
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/multiprocessing/util.py",
      "start": 54266779,
      "end": 54284247
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/netrc.py",
      "start": 54284247,
      "end": 54291278
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/ntpath.py",
      "start": 54291278,
      "end": 54322164
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/nturl2path.py",
      "start": 54322164,
      "end": 54324538
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/numbers.py",
      "start": 54324538,
      "end": 54336307
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/opcode.py",
      "start": 54336307,
      "end": 54339132
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/operator.py",
      "start": 54339132,
      "end": 54350112
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/optparse.py",
      "start": 54350112,
      "end": 54410481
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/os.py",
      "start": 54410481,
      "end": 54452108
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/pathlib/__init__.py",
      "start": 54452108,
      "end": 54452404
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/pathlib/_abc.py",
      "start": 54452404,
      "end": 54485969
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/pathlib/_local.py",
      "start": 54485969,
      "end": 54517381
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/pdb.py",
      "start": 54517381,
      "end": 54609903
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/pickle.py",
      "start": 54609903,
      "end": 54676860
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/pickletools.py",
      "start": 54676860,
      "end": 54770912
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/pkgutil.py",
      "start": 54770912,
      "end": 54789193
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/platform.py",
      "start": 54789193,
      "end": 54836538
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/plistlib.py",
      "start": 54836538,
      "end": 54866562
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/poplib.py",
      "start": 54866562,
      "end": 54881166
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/posixpath.py",
      "start": 54881166,
      "end": 54899399
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/pprint.py",
      "start": 54899399,
      "end": 54923557
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/profile.py",
      "start": 54923557,
      "end": 54946697
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/pstats.py",
      "start": 54946697,
      "end": 54975993
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/pty.py",
      "start": 54975993,
      "end": 54982130
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/py_compile.py",
      "start": 54982130,
      "end": 54989967
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/pyclbr.py",
      "start": 54989967,
      "end": 55001363
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/pydoc.py",
      "start": 55001363,
      "end": 55111851
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/pydoc_data/__init__.py",
      "start": 55111851,
      "end": 55111851
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/pydoc_data/_pydoc.css",
      "start": 55111851,
      "end": 55113176
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/pydoc_data/module_docs.py",
      "start": 55113176,
      "end": 55127927
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/pydoc_data/topics.py",
      "start": 55127927,
      "end": 55663074
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/queue.py",
      "start": 55663074,
      "end": 55676529
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/quopri.py",
      "start": 55676529,
      "end": 55683713
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/random.py",
      "start": 55683713,
      "end": 55720719
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/re/__init__.py",
      "start": 55720719,
      "end": 55738595
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/re/_casefix.py",
      "start": 55738595,
      "end": 55744039
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/re/_compiler.py",
      "start": 55744039,
      "end": 55770329
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/re/_constants.py",
      "start": 55770329,
      "end": 55776268
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/re/_parser.py",
      "start": 55776268,
      "end": 55817505
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/reprlib.py",
      "start": 55817505,
      "end": 55825573
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/rlcompleter.py",
      "start": 55825573,
      "end": 55833491
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/runpy.py",
      "start": 55833491,
      "end": 55846376
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/sched.py",
      "start": 55846376,
      "end": 55852727
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/secrets.py",
      "start": 55852727,
      "end": 55854711
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/selectors.py",
      "start": 55854711,
      "end": 55874168
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/shelve.py",
      "start": 55874168,
      "end": 55882978
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/shlex.py",
      "start": 55882978,
      "end": 55896331
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/shutil.py",
      "start": 55896331,
      "end": 55953794
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/signal.py",
      "start": 55953794,
      "end": 55956289
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/site-packages/README.txt",
      "start": 55956289,
      "end": 55956408
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/site.py",
      "start": 55956408,
      "end": 55981964
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/smtplib.py",
      "start": 55981964,
      "end": 56025882
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/socket.py",
      "start": 56025882,
      "end": 56063641
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/socketserver.py",
      "start": 56063641,
      "end": 56091706
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/sqlite3/__init__.py",
      "start": 56091706,
      "end": 56094207
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/sqlite3/__main__.py",
      "start": 56094207,
      "end": 56098495
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/sqlite3/dbapi2.py",
      "start": 56098495,
      "end": 56102126
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/sqlite3/dump.py",
      "start": 56102126,
      "end": 56106366
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/sre_compile.py",
      "start": 56106366,
      "end": 56106597
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/sre_constants.py",
      "start": 56106597,
      "end": 56106829
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/sre_parse.py",
      "start": 56106829,
      "end": 56107058
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/ssl.py",
      "start": 56107058,
      "end": 56159764
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/stat.py",
      "start": 56159764,
      "end": 56166072
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/statistics.py",
      "start": 56166072,
      "end": 56228253
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/string.py",
      "start": 56228253,
      "end": 56240039
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/stringprep.py",
      "start": 56240039,
      "end": 56252956
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/struct.py",
      "start": 56252956,
      "end": 56253213
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/subprocess.py",
      "start": 56253213,
      "end": 56344040
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/symtable.py",
      "start": 56344040,
      "end": 56358247
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/sysconfig/__init__.py",
      "start": 56358247,
      "end": 56385691
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/sysconfig/__main__.py",
      "start": 56385691,
      "end": 56394022
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/tabnanny.py",
      "start": 56394022,
      "end": 56405554
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/tarfile.py",
      "start": 56405554,
      "end": 56520840
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/tempfile.py",
      "start": 56520840,
      "end": 56553380
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/textwrap.py",
      "start": 56553380,
      "end": 56573338
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/this.py",
      "start": 56573338,
      "end": 56574341
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/threading.py",
      "start": 56574341,
      "end": 56629684
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/timeit.py",
      "start": 56629684,
      "end": 56643148
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/token.py",
      "start": 56643148,
      "end": 56645637
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/tokenize.py",
      "start": 56645637,
      "end": 56667205
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/tomllib/__init__.py",
      "start": 56667205,
      "end": 56667513
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/tomllib/_parser.py",
      "start": 56667513,
      "end": 56690179
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/tomllib/_re.py",
      "start": 56690179,
      "end": 56693137
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/tomllib/_types.py",
      "start": 56693137,
      "end": 56693391
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/tomllib/mypy.ini",
      "start": 56693391,
      "end": 56693842
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/trace.py",
      "start": 56693842,
      "end": 56723556
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/traceback.py",
      "start": 56723556,
      "end": 56790002
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/tracemalloc.py",
      "start": 56790002,
      "end": 56808049
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/tty.py",
      "start": 56808049,
      "end": 56810084
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/turtle.py",
      "start": 56810084,
      "end": 56956510
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/types.py",
      "start": 56956510,
      "end": 56967834
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/typing.py",
      "start": 56967834,
      "end": 57101055
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/unittest/__init__.py",
      "start": 57101055,
      "end": 57104278
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/unittest/__main__.py",
      "start": 57104278,
      "end": 57104750
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/unittest/_log.py",
      "start": 57104750,
      "end": 57107496
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/unittest/async_case.py",
      "start": 57107496,
      "end": 57113126
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/unittest/case.py",
      "start": 57113126,
      "end": 57171489
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/unittest/loader.py",
      "start": 57171489,
      "end": 57190830
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/unittest/main.py",
      "start": 57190830,
      "end": 57202466
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/unittest/mock.py",
      "start": 57202466,
      "end": 57313800
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/unittest/result.py",
      "start": 57313800,
      "end": 57322930
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/unittest/runner.py",
      "start": 57322930,
      "end": 57333298
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/unittest/signals.py",
      "start": 57333298,
      "end": 57335701
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/unittest/suite.py",
      "start": 57335701,
      "end": 57349213
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/unittest/util.py",
      "start": 57349213,
      "end": 57354428
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/urllib/__init__.py",
      "start": 57354428,
      "end": 57354428
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/urllib/error.py",
      "start": 57354428,
      "end": 57356843
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/urllib/parse.py",
      "start": 57356843,
      "end": 57402595
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/urllib/request.py",
      "start": 57402595,
      "end": 57505268
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/urllib/response.py",
      "start": 57505268,
      "end": 57507629
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/urllib/robotparser.py",
      "start": 57507629,
      "end": 57517316
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/uuid.py",
      "start": 57517316,
      "end": 57546774
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/venv/__init__.py",
      "start": 57546774,
      "end": 57577255
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/venv/__main__.py",
      "start": 57577255,
      "end": 57577396
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/venv/scripts/common/Activate.ps1",
      "start": 57577396,
      "end": 57586427
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/venv/scripts/common/activate",
      "start": 57586427,
      "end": 57588597
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/venv/scripts/common/activate.fish",
      "start": 57588597,
      "end": 57590805
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/venv/scripts/posix/activate.csh",
      "start": 57590805,
      "end": 57591742
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/warnings.py",
      "start": 57591742,
      "end": 57618813
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/wave.py",
      "start": 57618813,
      "end": 57642067
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/weakref.py",
      "start": 57642067,
      "end": 57663580
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/webbrowser.py",
      "start": 57663580,
      "end": 57688344
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/wsgiref/__init__.py",
      "start": 57688344,
      "end": 57689001
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/wsgiref/handlers.py",
      "start": 57689001,
      "end": 57710810
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/wsgiref/headers.py",
      "start": 57710810,
      "end": 57718180
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/wsgiref/simple_server.py",
      "start": 57718180,
      "end": 57723232
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/wsgiref/types.py",
      "start": 57723232,
      "end": 57724949
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/wsgiref/util.py",
      "start": 57724949,
      "end": 57730438
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/wsgiref/validate.py",
      "start": 57730438,
      "end": 57745474
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/xml/__init__.py",
      "start": 57745474,
      "end": 57746031
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/xml/dom/NodeFilter.py",
      "start": 57746031,
      "end": 57746967
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/xml/dom/__init__.py",
      "start": 57746967,
      "end": 57750986
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/xml/dom/domreg.py",
      "start": 57750986,
      "end": 57754437
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/xml/dom/expatbuilder.py",
      "start": 57754437,
      "end": 57790130
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/xml/dom/minicompat.py",
      "start": 57790130,
      "end": 57793497
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/xml/dom/minidom.py",
      "start": 57793497,
      "end": 57861953
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/xml/dom/pulldom.py",
      "start": 57861953,
      "end": 57873590
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/xml/dom/xmlbuilder.py",
      "start": 57873590,
      "end": 57886010
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/xml/etree/ElementInclude.py",
      "start": 57886010,
      "end": 57892962
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/xml/etree/ElementPath.py",
      "start": 57892962,
      "end": 57906959
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/xml/etree/ElementTree.py",
      "start": 57906959,
      "end": 57981585
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/xml/etree/__init__.py",
      "start": 57981585,
      "end": 57983190
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/xml/etree/cElementTree.py",
      "start": 57983190,
      "end": 57983272
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/xml/parsers/__init__.py",
      "start": 57983272,
      "end": 57983439
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/xml/parsers/expat.py",
      "start": 57983439,
      "end": 57983687
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/xml/sax/__init__.py",
      "start": 57983687,
      "end": 57986925
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/xml/sax/_exceptions.py",
      "start": 57986925,
      "end": 57991624
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/xml/sax/expatreader.py",
      "start": 57991624,
      "end": 58007658
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/xml/sax/handler.py",
      "start": 58007658,
      "end": 58023275
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/xml/sax/saxutils.py",
      "start": 58023275,
      "end": 58035530
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/xml/sax/xmlreader.py",
      "start": 58035530,
      "end": 58048154
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/xmlrpc/__init__.py",
      "start": 58048154,
      "end": 58048192
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/xmlrpc/client.py",
      "start": 58048192,
      "end": 58096753
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/xmlrpc/server.py",
      "start": 58096753,
      "end": 58133575
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/zipapp.py",
      "start": 58133575,
      "end": 58142193
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/zipfile/__init__.py",
      "start": 58142193,
      "end": 58231986
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/zipfile/__main__.py",
      "start": 58231986,
      "end": 58232044
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/zipfile/_path/__init__.py",
      "start": 58232044,
      "end": 58244e3
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/zipfile/_path/glob.py",
      "start": 58244e3,
      "end": 58247314
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/zipimport.py",
      "start": 58247314,
      "end": 58280204
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/zoneinfo/__init__.py",
      "start": 58280204,
      "end": 58281121
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/zoneinfo/_common.py",
      "start": 58281121,
      "end": 58286879
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/zoneinfo/_tzpath.py",
      "start": 58286879,
      "end": 58292604
    }, {
      "filename": "/nas/Temp/repos/blender-wasm-fork/wasm-sysroot/lib/python3.13/zoneinfo/_zoneinfo.py",
      "start": 58292604,
      "end": 58317456
    } ],
    "remote_package_size": 58317456
  });
})();

// end include: /tmp/tmp_ar6pv86.js
// include: /tmp/tmpy79his0t.js
// All the pre-js content up to here must remain later on, we need to run
// it.
if ((typeof ENVIRONMENT_IS_WASM_WORKER != "undefined" && ENVIRONMENT_IS_WASM_WORKER) || (typeof ENVIRONMENT_IS_PTHREAD != "undefined" && ENVIRONMENT_IS_PTHREAD) || (typeof ENVIRONMENT_IS_AUDIO_WORKLET != "undefined" && ENVIRONMENT_IS_AUDIO_WORKLET)) Module["preRun"] = [];

var necessaryPreJSTasks = Module["preRun"].slice();

// end include: /tmp/tmpy79his0t.js
// include: /tmp/tmpdh7kbdei.js
if (!Module["preRun"]) throw "Module.preRun should exist because file support used it; did a pre-js delete it?";

necessaryPreJSTasks.forEach(task => {
  if (Module["preRun"].indexOf(task) < 0) throw "All preRun tasks that exist before user pre-js code should remain after; did you replace Module or modify Module.preRun?";
});

// end include: /tmp/tmpdh7kbdei.js
var programArgs = [];

var thisProgram = "./this.program";

var quit_ = (status, toThrow) => {
  throw toThrow;
};

// In MODULARIZE mode _scriptName needs to be captured already at the very top of the page immediately when the page is parsed, so it is generated there
// before the page load. In non-MODULARIZE modes generate it here.
var _scriptName = globalThis.document?.currentScript?.src;

if (ENVIRONMENT_IS_WORKER) {
  _scriptName = self.location.href;
}

// `/` should be present at the end if `scriptDirectory` is not empty
var scriptDirectory = "";

function locateFile(path) {
  if (Module["locateFile"]) {
    return Module["locateFile"](path, scriptDirectory);
  }
  return scriptDirectory + path;
}

// Hooks that are implemented differently in different runtime environments.
var readAsync, readBinary;

if (ENVIRONMENT_IS_SHELL) {} else // Note that this includes Node.js workers when relevant (pthreads is enabled).
// Node.js workers are detected as a combination of ENVIRONMENT_IS_WORKER and
// ENVIRONMENT_IS_NODE.
if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  try {
    scriptDirectory = new URL(".", _scriptName).href;
  } catch {}
  if (!(globalThis.window || globalThis.WorkerGlobalScope)) throw new Error("not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)");
  {
    // include: web_or_worker_shell_read.js
    if (ENVIRONMENT_IS_WORKER) {
      readBinary = url => {
        var xhr = new XMLHttpRequest;
        xhr.open("GET", url, false);
        xhr.responseType = "arraybuffer";
        xhr.send(null);
        return new Uint8Array(/** @type{!ArrayBuffer} */ (xhr.response));
      };
    }
    readAsync = async url => {
      assert(!isFileURI(url), "readAsync does not work with file:// URLs");
      var response = await fetch(url, {
        credentials: "same-origin"
      });
      if (response.ok) {
        return response.arrayBuffer();
      }
      throw new Error(response.status + " : " + response.url);
    };
  }
} else {
  throw new Error("environment detection error");
}

var out = console.log.bind(console);

var err = console.error.bind(console);

var IDBFS = "IDBFS is no longer included by default; build with -lidbfs.js";

var PROXYFS = "PROXYFS is no longer included by default; build with -lproxyfs.js";

var WORKERFS = "WORKERFS is no longer included by default; build with -lworkerfs.js";

var FETCHFS = "FETCHFS is no longer included by default; build with -lfetchfs.js";

var ICASEFS = "ICASEFS is no longer included by default; build with -licasefs.js";

var JSFILEFS = "JSFILEFS is no longer included by default; build with -ljsfilefs.js";

var OPFS = "OPFS is no longer included by default; build with -lopfs.js";

var NODEFS = "NODEFS is no longer included by default; build with -lnodefs.js";

// perform assertions in shell.js after we set up out() and err(), as otherwise
// if an assertion fails it cannot print the message
assert(ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER || ENVIRONMENT_IS_NODE, "pthreads do not work in this environment yet (need Web Workers, or an alternative to them)");

assert(!ENVIRONMENT_IS_NODE, "node environment detected but not enabled at build time (add `node` to `-sENVIRONMENT` to enable)");

assert(!ENVIRONMENT_IS_SHELL, "shell environment detected but not enabled at build time (add `shell` to `-sENVIRONMENT` to enable)");

// end include: shell.js
// include: preamble.js
// === Preamble library stuff ===
// Documentation for the public APIs defined in this file must be updated in:
//    site/source/docs/api_reference/preamble.js.rst
// A prebuilt local version of the documentation is available at:
//    site/build/text/docs/api_reference/preamble.js.txt
// You can also build docs locally as HTML or other formats in site/
// An online HTML version (which may be of a different version of Emscripten)
//    is up at http://kripken.github.io/emscripten-site/docs/api_reference/preamble.js.html
var wasmBinary;

if (!globalThis.WebAssembly) {
  err("no native wasm support detected");
}

// Wasm globals
// For sending to workers.
var wasmModule;

//========================================
// Runtime essentials
//========================================
// whether we are quitting the application. no code should run after this.
// set in exit() and abort()
var ABORT = false;

// set by exit() and abort().  Passed to 'onExit' handler.
// NOTE: This is also used as the process return code in shell environments
// but only when noExitRuntime is false.
var EXITSTATUS;

// In STRICT mode, we only define assert() when ASSERTIONS is set.  i.e. we
// don't define it at all in release modes.  This matches the behaviour of
// MINIMAL_RUNTIME.
// TODO(sbc): Make this the default even without STRICT enabled.
/** @type {function(*, string=)} */ function assert(condition, text) {
  if (!condition) {
    abort("Assertion failed" + (text ? ": " + text : ""));
  }
}

// We used to include malloc/free by default in the past. Show a helpful error in
// builds with assertions.
/**
 * Indicates whether filename is delivered via file protocol (as opposed to http/https)
 * @noinline
 */ var isFileURI = filename => filename.startsWith("file://");

// include: runtime_common.js
// include: runtime_stack_check.js
// Initializes the stack cookie. Called at the startup of main and at the startup of each thread in pthreads mode.
function writeStackCookie() {
  var max = _emscripten_stack_get_end();
  assert((max & 3) == 0);
  // If the stack ends at address zero we write our cookies 4 bytes into the
  // stack.  This prevents interference with SAFE_HEAP and ASAN which also
  // monitor writes to address zero.
  if (max == 0) {
    max += 4;
  }
  // The stack grow downwards towards _emscripten_stack_get_end.
  // We write cookies to the final two words in the stack and detect if they are
  // ever overwritten.
  (growMemViews(), HEAPU32)[((max) >>> 2) >>> 0] = 34821223;
  (growMemViews(), HEAPU32)[(((max) + (4)) >>> 2) >>> 0] = 2310721022;
  // Also test the global address 0 for integrity.
  (growMemViews(), HEAPU32)[((0) >>> 2) >>> 0] = 1668509029;
}

function checkStackCookie() {
  if (ABORT) return;
  var max = _emscripten_stack_get_end();
  // See writeStackCookie().
  if (max == 0) {
    max += 4;
  }
  var cookie1 = (growMemViews(), HEAPU32)[((max) >>> 2) >>> 0];
  var cookie2 = (growMemViews(), HEAPU32)[(((max) + (4)) >>> 2) >>> 0];
  if (cookie1 != 34821223 || cookie2 != 2310721022) {
    abort(`Stack overflow! Stack cookie has been overwritten at ${ptrToString(max)}, expected hex dwords 0x89BACDFE and 0x2135467, but received ${ptrToString(cookie2)} ${ptrToString(cookie1)}`);
  }
  // Also test the global address 0 for integrity.
  if ((growMemViews(), HEAPU32)[((0) >>> 2) >>> 0] != 1668509029) {
    abort("Runtime error: The application has corrupted its heap memory area (address zero)!");
  }
}

// end include: runtime_stack_check.js
// include: runtime_exceptions.js
// Base Emscripten EH error class
class EmscriptenEH extends Error {}

class EmscriptenSjLj extends EmscriptenEH {}

class CppException extends EmscriptenEH {
  constructor(excPtr) {
    super(excPtr);
    this.excPtr = excPtr;
    const excInfo = getExceptionMessage(this);
    this.name = excInfo[0];
    this.message = excInfo[1];
  }
}

// end include: runtime_exceptions.js
// include: runtime_debug.js
var runtimeDebug = true;

// Switch to false at runtime to disable logging at the right times
// Used by XXXXX_DEBUG settings to output debug messages.
function dbg(...args) {
  if (!runtimeDebug && typeof runtimeDebug != "undefined") return;
  // TODO(sbc): Make this configurable somehow.  Its not always convenient for
  // logging to show up as warnings.
  console.warn(...args);
}

// Endianness check
(() => {
  var h16 = new Int16Array(1);
  var h8 = new Int8Array(h16.buffer);
  h16[0] = 25459;
  if (h8[0] !== 115 || h8[1] !== 99) abort("Runtime error: expected the system to be little-endian! (Run with -sSUPPORT_BIG_ENDIAN to bypass)");
})();

function consumedModuleProp(prop) {
  var value = Module[prop];
  var msg = `Attempt to modify \`Module.${prop}\` after it has already been processed.  This can happen, for example, when code is injected via '--post-js' rather than '--pre-js'`;
  if (Array.isArray(value)) {
    value = new Proxy(value, {
      set(target, key, val) {
        abort(msg);
        return false;
      },
      defineProperty(target, key, descriptor) {
        abort(msg);
        return false;
      },
      deleteProperty(target, key) {
        abort(msg);
        return false;
      }
    });
  }
  Object.defineProperty(Module, prop, {
    configurable: true,
    get() {
      return value;
    },
    set() {
      abort(msg);
    }
  });
}

function makeInvalidEarlyAccess(name) {
  return () => assert(false, `call to '${name}' via reference taken before Wasm module initialization`);
}

function ignoredModuleProp(prop) {
  if (Object.getOwnPropertyDescriptor(Module, prop)) {
    abort(`\`Module.${prop}\` was supplied but \`${prop}\` not included in INCOMING_MODULE_JS_API`);
  }
}

// forcing the filesystem exports a few things by default
function isExportedByForceFilesystem(name) {
  return name === "FS_createPath" || name === "FS_createDataFile" || name === "FS_createPreloadedFile" || name === "FS_preloadFile" || name === "FS_unlink" || name === "addRunDependency" || name === "removeRunDependency";
}

/**
 * Intercept access to a symbols in the global symbol.  This enables us to give
 * informative warnings/errors when folks attempt to use symbols they did not
 * include in their build, or no symbols that no longer exist.
 *
 * We don't define this in MODULARIZE mode since in that mode emscripten symbols
 * are never placed in the global scope.
 */ function hookGlobalSymbolAccess(sym, func) {
  if (!Object.getOwnPropertyDescriptor(globalThis, sym)) {
    Object.defineProperty(globalThis, sym, {
      configurable: true,
      get() {
        func();
        return undefined;
      }
    });
  }
}

function missingGlobal(sym, msg) {
  hookGlobalSymbolAccess(sym, () => {
    warnOnce(`\`${sym}\` is no longer defined by emscripten. ${msg}`);
  });
}

missingGlobal("buffer", "Please use HEAP8.buffer or wasmMemory.buffer");

missingGlobal("asm", "Please use wasmExports instead");

function missingLibrarySymbol(sym) {
  hookGlobalSymbolAccess(sym, () => {
    // Can't `abort()` here because it would break code that does runtime
    // checks.  e.g. `if (typeof SDL === 'undefined')`.
    var msg = `\`${sym}\` is a library symbol and not included by default; add it to your library.js __deps or to DEFAULT_LIBRARY_FUNCS_TO_INCLUDE on the command line`;
    // DEFAULT_LIBRARY_FUNCS_TO_INCLUDE requires the name as it appears in
    // library.js, which means $name for a JS name with no prefix, or name
    // for a JS name like _name.
    var librarySymbol = sym;
    if (!librarySymbol.startsWith("_")) {
      librarySymbol = "$" + sym;
    }
    msg += ` (e.g. -sDEFAULT_LIBRARY_FUNCS_TO_INCLUDE='${librarySymbol}')`;
    if (isExportedByForceFilesystem(sym)) {
      msg += ". Alternatively, forcing filesystem support (-sFORCE_FILESYSTEM) can export this for you";
    }
    warnOnce(msg);
  });
  // Any symbol that is not included from the JS library is also (by definition)
  // not exported on the Module object.
  unexportedRuntimeSymbol(sym);
}

function unexportedRuntimeSymbol(sym) {
  if (ENVIRONMENT_IS_PTHREAD) {
    return;
  }
  if (!Object.getOwnPropertyDescriptor(Module, sym)) {
    Object.defineProperty(Module, sym, {
      configurable: true,
      get() {
        var msg = `'${sym}' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the Emscripten FAQ)`;
        if (isExportedByForceFilesystem(sym)) {
          msg += ". Alternatively, forcing filesystem support (-sFORCE_FILESYSTEM) can export this for you";
        }
        abort(msg);
      }
    });
  }
}

/**
 * Override `err`/`out`/`dbg` to report thread / worker information
 */ function initWorkerLogging() {
  function getLogPrefix() {
    var t = 0;
    if (runtimeInitialized && typeof _pthread_self != "undefined") {
      t = _pthread_self();
    }
    return `w:${workerID},t:${ptrToString(t)}:`;
  }
  // Prefix all dbg() messages with the calling thread info.
  var origDbg = dbg;
  dbg = (...args) => origDbg(getLogPrefix(), ...args);
}

initWorkerLogging();

// end include: runtime_debug.js
// Support for growable heap + pthreads, where the buffer may change, so JS views
// must be updated.
function growMemViews() {
  // `updateMemoryViews` updates all the views simultaneously, so it's enough to check any of them.
  if (wasmMemory.buffer != HEAP8.buffer) {
    updateMemoryViews();
  }
}

// include: runtime_pthread.js
// Pthread Web Worker handling code.
// This code runs only on pthread web workers and handles pthread setup
// and communication with the main thread via postMessage.
// Unique ID of the current pthread worker (zero on non-pthread-workers
// including the main thread).
var workerID = 0;

var startWorker;

if (ENVIRONMENT_IS_PTHREAD) {
  // Thread-local guard variable for one-time init of the JS state
  var initializedJS = false;
  // Turn unhandled rejected promises into errors so that the main thread will be
  // notified about them.
  self.onunhandledrejection = e => {
    throw e.reason || e;
  };
  function handleMessage(e) {
    try {
      var msgData = e.data;
      //dbg('msgData: ' + Object.keys(msgData));
      var cmd = msgData.cmd;
      if (cmd == 1) {
        // Preload command that is called once per worker to parse and load the Emscripten code.
        workerID = msgData.workerID;
        // Until we initialize the runtime, queue up any further incoming messages.
        let messageQueue = [];
        self.onmessage = e => messageQueue.push(e);
        // And add a callback for when the runtime is initialized.
        startWorker = () => {
          // Notify the main thread that this thread has loaded.
          postMessage({
            cmd: 3
          });
          // Process any messages that were queued before the thread was ready.
          for (let msg of messageQueue) {
            handleMessage(msg);
          }
          // Restore the real message handler.
          self.onmessage = handleMessage;
        };
        // Use `const` here to ensure that the variable is scoped only to
        // that iteration, allowing safe reference from a closure.
        for (const handler of msgData.handlers) {
          // If the main module has a handler for a certain event, but no
          // handler exists on the pthread worker, then proxy that handler
          // back to the main thread.
          if (!Module[handler] || Module[handler].proxy) {
            Module[handler] = (...args) => {
              postMessage({
                cmd: 9,
                handler,
                args
              });
            };
            // Rebind the out / err handlers if needed
            if (handler == "print") out = Module[handler];
            if (handler == "printErr") err = Module[handler];
          }
        }
        wasmMemory = msgData.wasmMemory;
        updateMemoryViews();
        wasmModule = msgData.wasmModule;
        createWasm();
        run();
      } else if (cmd == 2) {
        assert(msgData.pthread_ptr);
        assert(wasmMemory, "CMD_RUN received before CMD_LOAD");
        // Call inside JS module to set up the stack frame for this pthread in JS module scope.
        // This needs to be the first thing that we do, as we cannot call to any C/C++ functions
        // until the thread stack is initialized.
        establishStackSpace(msgData.pthread_ptr);
        // Pass the thread address to wasm to store it for fast access.
        __emscripten_thread_init(msgData.pthread_ptr, /*is_main=*/ 0, /*is_runtime=*/ 0, /*can_block=*/ 1, 0, 0);
        PThread.threadInitTLS();
        // Await mailbox notifications with `Atomics.waitAsync` so we can start
        // using the fast `Atomics.notify` notification path.
        __emscripten_thread_mailbox_await(msgData.pthread_ptr);
        if (!initializedJS) {
          initializedJS = true;
        }
        try {
          invokeEntryPoint(msgData.start_routine, msgData.arg);
        } catch (ex) {
          if (ex != "unwind") {
            // The pthread "crashed".  Do not call `_emscripten_thread_exit` (which
            // would make this thread joinable).  Instead, re-throw the exception
            // and let the top level handler propagate it back to the main thread.
            throw ex;
          }
        }
      } else if (cmd == 4) {
        if (initializedJS) {
          checkMailbox();
        }
      } else if (cmd) {
        // The received message looks like something that should be handled by this message
        // handler, (since there is a cmd field present), but is not one of the
        // recognized commands:
        err(`worker: received unknown command ${cmd}`);
        err(msgData);
      }
    } catch (ex) {
      err(`worker: onmessage() captured an uncaught exception: ${ex}`);
      if (ex?.stack) err(ex.stack);
      if (runtimeInitialized) __emscripten_thread_crashed();
      throw ex;
    }
  }
  self.onmessage = handleMessage;
}

// ENVIRONMENT_IS_PTHREAD
// end include: runtime_pthread.js
// Memory management
var runtimeInitialized = false;

function updateMemoryViews() {
  var b = wasmMemory.buffer;
  HEAP8 = new Int8Array(b);
  HEAP16 = new Int16Array(b);
  Module["HEAPU8"] = HEAPU8 = new Uint8Array(b);
  Module["HEAPU16"] = HEAPU16 = new Uint16Array(b);
  HEAP32 = new Int32Array(b);
  HEAPU32 = new Uint32Array(b);
  Module["HEAPF32"] = HEAPF32 = new Float32Array(b);
  HEAPF64 = new Float64Array(b);
  HEAP64 = new BigInt64Array(b);
  HEAPU64 = new BigUint64Array(b);
}

// In non-standalone/normal mode, we create the memory here.
// include: runtime_init_memory.js
// Create the wasm memory. (Note: this only applies if IMPORTED_MEMORY is defined)
// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
function initMemory() {
  if ((ENVIRONMENT_IS_PTHREAD)) {
    return;
  }
  if (Module["wasmMemory"]) {
    wasmMemory = Module["wasmMemory"];
  } else {
    var INITIAL_MEMORY = Module["INITIAL_MEMORY"] || 1073741824;
    assert(INITIAL_MEMORY >= 16777216, `INITIAL_MEMORY should be larger than STACK_SIZE, was ${INITIAL_MEMORY}! (STACK_SIZE=16777216)`);
    /** @suppress {checkTypes} */ wasmMemory = new WebAssembly.Memory({
      "initial": INITIAL_MEMORY / 65536,
      // In theory we should not need to emit the maximum if we want "unlimited"
      // or 4GB of memory, but VMs error on that atm, see
      // https://github.com/emscripten-core/emscripten/issues/14130
      // And in the pthreads case we definitely need to emit a maximum. So
      // always emit one.
      "maximum": 65536,
      "shared": true
    });
  }
  updateMemoryViews();
}

// end include: runtime_init_memory.js
// include: memoryprofiler.js
// end include: memoryprofiler.js
// end include: runtime_common.js
assert(globalThis.Int32Array && globalThis.Float64Array && Int32Array.prototype.subarray && Int32Array.prototype.set, "JS engine does not provide full typed array support");

function preRun() {
  assert(!ENVIRONMENT_IS_PTHREAD);
  // PThreads reuse the runtime from the main thread.
  if (Module["preRun"]) {
    if (typeof Module["preRun"] == "function") Module["preRun"] = [ Module["preRun"] ];
    while (Module["preRun"].length) {
      addOnPreRun(Module["preRun"].shift());
    }
  }
  consumedModuleProp("preRun");
  // Begin ATPRERUNS hooks
  callRuntimeCallbacks(onPreRuns);
}

function initRuntime() {
  assert(!runtimeInitialized);
  runtimeInitialized = true;
  if (ENVIRONMENT_IS_PTHREAD) return startWorker();
  checkStackCookie();
  // No ATINITS hooks
  wasmExports["__wasm_call_ctors"]();
}

function preMain() {
  checkStackCookie();
}

function postRun() {
  checkStackCookie();
  if ((ENVIRONMENT_IS_PTHREAD)) {
    return;
  }
  // PThreads reuse the runtime from the main thread.
  if (Module["postRun"]) {
    if (typeof Module["postRun"] == "function") Module["postRun"] = [ Module["postRun"] ];
    while (Module["postRun"].length) {
      addOnPostRun(Module["postRun"].shift());
    }
  }
  consumedModuleProp("postRun");
  // Begin ATPOSTRUNS hooks
  callRuntimeCallbacks(onPostRuns);
}

/**
 * @param {string|number=} what
 */ function abort(what) {
  Module["onAbort"]?.(what);
  what = `Aborted(${what})`;
  // TODO(sbc): Should we remove printing and leave it up to whoever
  // catches the exception?
  err(what);
  ABORT = true;
  // Use a wasm runtime error, because a JS error might be seen as a foreign
  // exception, which means we'd run destructors on it. We need the error to
  // simply make the program stop.
  // FIXME This approach does not work in Wasm EH because it currently does not assume
  // all RuntimeErrors are from traps; it decides whether a RuntimeError is from
  // a trap or not based on a hidden field within the object. So at the moment
  // we don't have a way of throwing a wasm trap from JS. TODO Make a JS API that
  // allows this in the wasm spec.
  // Suppress closure compiler warning here. Closure compiler's builtin extern
  // definition for WebAssembly.RuntimeError claims it takes no arguments even
  // though it can.
  // TODO(https://github.com/google/closure-compiler/pull/3913): Remove if/when upstream closure gets fixed.
  /** @suppress {checkTypes} */ var e = new WebAssembly.RuntimeError(what);
  // Throw the error whether or not MODULARIZE is set because abort is used
  // in code paths apart from instantiation where an exception is expected
  // to be thrown when abort is called.
  throw e;
}

function createExportWrapper(name, nargs) {
  return (...args) => {
    assert(runtimeInitialized, `native function \`${name}\` called before runtime initialization`);
    var f = wasmExports[name];
    assert(f, `exported native function \`${name}\` not found`);
    // Only assert for too many arguments. Too few can be valid since the missing arguments will be zero filled.
    assert(args.length <= nargs, `native function \`${name}\` called with ${args.length} args but expects ${nargs}`);
    return f(...args);
  };
}

var wasmBinaryFile;

function findWasmBinary() {
  return locateFile("blender.wasm");
}

function getBinarySync(file) {
  if (file == wasmBinaryFile && wasmBinary) {
    return new Uint8Array(wasmBinary);
  }
  if (readBinary) {
    return readBinary(file);
  }
  // Throwing a plain string here, even though it not normally advisable since
  // this gets turning into an `abort` in instantiateArrayBuffer.
  throw "both async and sync fetching of the wasm failed";
}

async function getWasmBinary(binaryFile) {
  // If we don't have the binary yet, load it asynchronously using readAsync.
  if (!wasmBinary) {
    // Fetch the binary using readAsync
    try {
      var response = await readAsync(binaryFile);
      return new Uint8Array(response);
    } catch {}
  }
  // Otherwise, getBinarySync should be able to get it synchronously
  return getBinarySync(binaryFile);
}

async function instantiateArrayBuffer(binaryFile, imports) {
  try {
    var binary = await getWasmBinary(binaryFile);
    var instance = await WebAssembly.instantiate(binary, imports);
    return instance;
  } catch (reason) {
    err(`failed to asynchronously prepare wasm: ${reason}`);
    // Warn on some common problems.
    if (isFileURI(binaryFile)) {
      err(`warning: Loading from a file URI (${binaryFile}) is not supported in most browsers. See https://emscripten.org/docs/getting_started/FAQ.html#how-do-i-run-a-local-webserver-for-testing-why-does-my-program-stall-in-downloading-or-preparing`);
    }
    abort(reason);
  }
}

async function instantiateAsync(binary, binaryFile, imports) {
  if (!binary) {
    try {
      var response = fetch(binaryFile, {
        credentials: "same-origin"
      });
      var instantiationResult = await WebAssembly.instantiateStreaming(response, imports);
      return instantiationResult;
    } catch (reason) {
      // We expect the most common failure cause to be a bad MIME type for the binary,
      // in which case falling back to ArrayBuffer instantiation should work.
      err(`wasm streaming compile failed: ${reason}`);
      err("falling back to ArrayBuffer instantiation");
    }
  }
  return instantiateArrayBuffer(binaryFile, imports);
}

function getWasmImports() {
  assignWasmImports();
  // prepare imports
  var imports = {
    "env": wasmImports,
    "wasi_snapshot_preview1": wasmImports
  };
  return imports;
}

// Create the wasm instance.
// Receives the wasm imports, returns the exports.
async function createWasm() {
  // Load the wasm module and create an instance of using native support in the JS engine.
  // handle a generated wasm instance, receiving its exports and
  // performing other necessary setup
  /** @param {WebAssembly.Module=} module*/ function receiveInstance(instance, module) {
    wasmExports = instance.exports;
    wasmExports = applySignatureConversions(wasmExports);
    registerTLSInit(wasmExports["_emscripten_tls_init"]);
    assignWasmExports(wasmExports);
    // We now have the Wasm module loaded up, keep a reference to the compiled module so we can post it to the workers.
    wasmModule = module;
    return wasmExports;
  }
  // Prefer streaming instantiation if available.
  // Async compilation can be confusing when an error on the page overwrites Module
  // (for example, if the order of elements is wrong, and the one defining Module is
  // later), so we save Module and check it later.
  var trueModule = Module;
  function receiveInstantiationResult(result) {
    // 'result' is a ResultObject object which has both the module and instance.
    // receiveInstance() will swap in the exports (to Module.asm) so they can be called
    assert(Module === trueModule, "the Module object should not be replaced during async compilation - perhaps the order of HTML elements is wrong?");
    trueModule = null;
    return receiveInstance(result["instance"], result["module"]);
  }
  var info = getWasmImports();
  // User shell pages can write their own Module.instantiateWasm = function(imports, successCallback) callback
  // to manually instantiate the Wasm module themselves. This allows pages to
  // run the instantiation parallel to any other async startup actions they are
  // performing.
  // Also pthreads and wasm workers initialize the wasm instance through this
  // path.
  if (Module["instantiateWasm"]) {
    return new Promise((resolve, reject) => {
      try {
        Module["instantiateWasm"](info, (inst, mod) => {
          resolve(receiveInstance(inst, mod));
        });
      } catch (e) {
        err(`Module.instantiateWasm callback failed with error: ${e}`);
        reject(e);
      }
    });
  }
  if ((ENVIRONMENT_IS_PTHREAD)) {
    // Instantiate from the module that was received via postMessage from
    // the main thread. We can just use sync instantiation in the worker.
    assert(wasmModule, "wasmModule should have been received via postMessage");
    var instance = new WebAssembly.Instance(wasmModule, getWasmImports());
    return receiveInstance(instance, wasmModule);
  }
  wasmBinaryFile ??= findWasmBinary();
  var result = await instantiateAsync(wasmBinary, wasmBinaryFile, info);
  var exports = receiveInstantiationResult(result);
  return exports;
}

// end include: preamble.js
// Begin JS library code
class ExitStatus {
  name="ExitStatus";
  constructor(status) {
    this.message = `Program terminated with exit(${status})`;
    this.status = status;
  }
}

/** @type {!Int16Array} */ var HEAP16;

/** @type {!Int32Array} */ var HEAP32;

/** not-@type {!BigInt64Array} */ var HEAP64;

/** @type {!Int8Array} */ var HEAP8;

/** @type {!Float32Array} */ var HEAPF32;

/** @type {!Float64Array} */ var HEAPF64;

/** @type {!Uint16Array} */ var HEAPU16;

/** @type {!Uint32Array} */ var HEAPU32;

/** not-@type {!BigUint64Array} */ var HEAPU64;

/** @type {!Uint8Array} */ var HEAPU8;

var terminateWorker = worker => {
  worker.terminate();
  // terminate() can be asynchronous, so in theory the worker can continue
  // to run for some amount of time after termination.  However from our POV
  // the worker is now dead and we don't want to hear from it again, so we stub
  // out its message handler here.  This avoids having to check in each of
  // the onmessage handlers if the message was coming from a valid worker.
  worker.onmessage = e => {
    var cmd = e.data.cmd;
    err(`received "${cmd}" command from terminated worker: ${worker.workerID}`);
  };
};

var cleanupThread = pthread_ptr => {
  assert(!ENVIRONMENT_IS_PTHREAD, "cleanupThread() should only be called from the main thread");
  assert(pthread_ptr, "null pthread_ptr passed to cleanupThread");
  var worker = PThread.pthreads[pthread_ptr];
  assert(worker);
  PThread.returnWorkerToPool(worker);
};

var callRuntimeCallbacks = callbacks => {
  while (callbacks.length > 0) {
    // Pass the module as the first argument.
    callbacks.shift()(Module);
  }
};

var onPreRuns = [];

var addOnPreRun = cb => onPreRuns.push(cb);

var runDependencies = 0;

var dependenciesFulfilled = null;

var runDependencyTracking = {};

var runDependencyWatcher = null;

var removeRunDependency = id => {
  runDependencies--;
  Module["monitorRunDependencies"]?.(runDependencies);
  assert(id, "removeRunDependency requires an ID");
  assert(runDependencyTracking[id]);
  delete runDependencyTracking[id];
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback();
    }
  }
};

var addRunDependency = id => {
  runDependencies++;
  Module["monitorRunDependencies"]?.(runDependencies);
  assert(id, "addRunDependency requires an ID");
  assert(!runDependencyTracking[id]);
  runDependencyTracking[id] = 1;
  if (runDependencyWatcher === null && globalThis.setInterval) {
    // Check for missing dependencies every few seconds
    runDependencyWatcher = setInterval(() => {
      if (ABORT) {
        clearInterval(runDependencyWatcher);
        runDependencyWatcher = null;
        return;
      }
      var shown = false;
      for (var dep in runDependencyTracking) {
        if (!shown) {
          shown = true;
          err("still waiting on run dependencies:");
        }
        err(`dependency: ${dep}`);
      }
      if (shown) {
        err("(end of list)");
      }
    }, 1e4);
  }
};

var spawnThread = threadParams => {
  assert(!ENVIRONMENT_IS_PTHREAD, "spawnThread() should only be called from the main thread");
  assert(threadParams.pthread_ptr, "spawnThread called with null pthread ptr");
  var worker = PThread.getNewWorker();
  if (!worker) {
    // No available workers in the PThread pool.
    return 6;
  }
  assert(!worker.pthread_ptr);
  // Add to pthreads map
  PThread.pthreads[threadParams.pthread_ptr] = worker;
  worker.pthread_ptr = threadParams.pthread_ptr;
  var msg = {
    cmd: 2,
    start_routine: threadParams.startRoutine,
    arg: threadParams.arg,
    pthread_ptr: threadParams.pthread_ptr
  };
  // Ask the worker to start executing its pthread entry point function.
  worker.postMessage(msg, threadParams.transferList);
  return 0;
};

var runtimeKeepaliveCounter = 0;

var keepRuntimeAlive = () => noExitRuntime || runtimeKeepaliveCounter > 0;

var stackSave = () => _emscripten_stack_get_current();

var stackRestore = val => __emscripten_stack_restore(val);

var stackAlloc = sz => __emscripten_stack_alloc(sz);

/** @type{function(number, (number|boolean), ...number)} */ var proxyToMainThread = (funcIndex, emAsmAddr, proxyMode, ...callArgs) => {
  // EM_ASM proxying is done by passing a pointer to the address of the EM_ASM
  // content as `emAsmAddr`.  JS library proxying is done by passing an index
  // into `proxiedJSCallArgs` as `funcIndex`. If `emAsmAddr` is non-zero then
  // `funcIndex` will be ignored.
  // Additional arguments are passed after the first three are the actual
  // function arguments.
  // The serialization buffer contains the number of call params, and then
  // all the args here.
  // We also pass 'proxyMode' to C separately, since C needs to look at it.
  // Allocate a buffer (on the stack), which will be copied if necessary by
  // the C code.
  // First passed parameter specifies the number of arguments to the function.
  // When BigInt support is enabled, we must handle types in a more complex
  // way, detecting at runtime if a value is a BigInt or not (as we have no
  // type info here). To do that, add a "prefix" before each value that
  // indicates if it is a BigInt, which effectively doubles the number of
  // values we serialize for proxying. TODO: pack this?
  var bufSize = 8 * callArgs.length * 2;
  var sp = stackSave();
  var args = stackAlloc(bufSize);
  var b = ((args) >>> 3);
  for (var arg of callArgs) {
    if (typeof arg == "bigint") {
      // The prefix is non-zero to indicate a bigint.
      (growMemViews(), HEAP64)[b++ >>> 0] = 1n;
      (growMemViews(), HEAP64)[b++ >>> 0] = arg;
    } else {
      // The prefix is zero to indicate a JS Number.
      (growMemViews(), HEAP64)[b++ >>> 0] = 0n;
      (growMemViews(), HEAPF64)[b++ >>> 0] = arg;
    }
  }
  var rtn = __emscripten_run_js_on_main_thread(funcIndex, emAsmAddr, bufSize, args, proxyMode);
  stackRestore(sp);
  return rtn;
};

function _proc_exit(code) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(0, 0, 1, code);
  EXITSTATUS = code;
  if (!keepRuntimeAlive()) {
    PThread.terminateAllThreads();
    Module["onExit"]?.(code);
    ABORT = true;
  }
  quit_(code, new ExitStatus(code));
}

function exitOnMainThread(returnCode) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(1, 0, 0, returnCode);
  _exit(returnCode);
}

/** @param {boolean|number=} implicit */ var exitJS = (status, implicit) => {
  EXITSTATUS = status;
  checkUnflushedContent();
  if (ENVIRONMENT_IS_PTHREAD) {
    // implicit exit can never happen on a pthread
    assert(!implicit);
    // When running in a pthread we propagate the exit back to the main thread
    // where it can decide if the whole process should be shut down or not.
    // The pthread may have decided not to exit its own runtime, for example
    // because it runs a main loop, but that doesn't affect the main thread.
    exitOnMainThread(status);
    throw "unwind";
  }
  // if exit() was called explicitly, warn the user if the runtime isn't actually being shut down
  if (keepRuntimeAlive() && !implicit) {
    var msg = `program exited (with status: ${status}), but keepRuntimeAlive() is set (counter=${runtimeKeepaliveCounter}) due to an async operation, so halting execution but not exiting the runtime or preventing further async execution (you can use emscripten_force_exit, if you want to force a true shutdown)`;
    err(msg);
  }
  _proc_exit(status);
};

var _exit = exitJS;

var waitAsyncPolyfilled = (!Atomics.waitAsync || (globalThis.navigator?.userAgent && Number((navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./) || [])[2]) < 91));

function ptrToString(ptr) {
  assert(typeof ptr === "number", `ptrToString expects a number, got ${typeof ptr}`);
  // Convert to 32-bit unsigned value
  ptr >>>= 0;
  return "0x" + ptr.toString(16).padStart(8, "0");
}

var PThread = {
  unusedWorkers: [],
  tlsInitFunctions: [],
  pthreads: {},
  nextWorkerID: 1,
  init() {
    if ((!(ENVIRONMENT_IS_PTHREAD))) {
      PThread.initMainThread();
    }
  },
  initMainThread() {
    var pthreadPoolSize = 32;
    // Start loading up the Worker pool, if requested.
    while (pthreadPoolSize--) {
      PThread.allocateUnusedWorker();
    }
    // MINIMAL_RUNTIME takes care of calling loadWasmModuleToAllWorkers
    // in postamble_minimal.js
    addOnPreRun(async () => {
      var pthreadPoolReady = PThread.loadWasmModuleToAllWorkers();
      addRunDependency("loading-workers");
      await pthreadPoolReady;
      removeRunDependency("loading-workers");
    });
  },
  terminateAllThreads: () => {
    assert(!ENVIRONMENT_IS_PTHREAD, "terminateAllThreads() should only be called from the main thread");
    // Attempt to kill all workers.  Sadly (at least on the web) there is no
    // way to terminate a worker synchronously, or to be notified when a
    // worker is actually terminated.  This means there is some risk that
    // pthreads will continue to be executing after `worker.terminate` has
    // returned.  For this reason, we don't call `returnWorkerToPool` here or
    // free the underlying pthread data structures.
    for (var worker of Object.values(PThread.pthreads)) {
      terminateWorker(worker);
    }
    for (var worker of PThread.unusedWorkers) {
      terminateWorker(worker);
    }
    PThread.unusedWorkers = [];
    PThread.pthreads = {};
  },
  terminateRuntime: () => {
    assert(!ENVIRONMENT_IS_PTHREAD, "terminateRuntime() should only be called from the main thread");
    PThread.terminateAllThreads();
    var pthread_ptr = _pthread_self();
    ___set_thread_state(0, 0, 0, 1);
    if (!waitAsyncPolyfilled) {
      // Break the waitAsync loop.  Note that checkMailbox will not
      // re-register since the `___set_thread_state` above causes _pthread_self
      // to return 0.
      Atomics.notify((growMemViews(), HEAP32), ((pthread_ptr) >>> 2));
    }
  },
  returnWorkerToPool: worker => {
    // We don't want to run main thread queued calls here, since we are doing
    // some operations that leave the worker queue in an invalid state until
    // we are completely done (it would be bad if free() ends up calling a
    // queued pthread_create which looks at the global data structures we are
    // modifying). To achieve that, defer the free() until the very end, when
    // we are all done.
    var pthread_ptr = worker.pthread_ptr;
    delete PThread.pthreads[pthread_ptr];
    // Note: worker is intentionally not terminated so the pool can
    // dynamically grow.
    PThread.unusedWorkers.push(worker);
    // Not a running Worker anymore
    // Detach the worker from the pthread object, and return it to the
    // worker pool as an unused worker.
    worker.pthread_ptr = 0;
    // Finally, free the underlying (and now-unused) pthread structure in
    // linear memory.
    __emscripten_thread_free_data(pthread_ptr);
  },
  threadInitTLS() {
    // Call thread init functions (these are the _emscripten_tls_init for each
    // module loaded.
    PThread.tlsInitFunctions.forEach(f => f());
  },
  loadWasmModuleToWorker: worker => new Promise(onFinishedLoading => {
    worker.onmessage = e => {
      var d = e.data;
      var cmd = d.cmd;
      // If this message is intended to a recipient that is not the main
      // thread, forward it to the target thread. This is currently only
      // used by `CMD_CHECK_MAILBOX`.
      if (d.targetThread) {
        // pthreads should not be relaying messages to themselves.
        assert(d.targetThread != _pthread_self());
        var targetWorker = PThread.pthreads[d.targetThread];
        if (!targetWorker) err(`worker sent message (${cmd}) to pthread (${d.targetThread}) that no longer exists`);
        targetWorker?.postMessage(d);
        return;
      }
      if (d === "setimmediate" || d === "_si") {
        // Worker wants to postMessage() to itself to implement setImmediate()
        // emulation.
        worker.postMessage(d);
        return;
      }
      switch (cmd) {
       case 4:
        checkMailbox();
        break;

       case 5:
        spawnThread(d);
        break;

       case 6:
        // cleanupThread needs to be run via callUserCallback since it calls
        // back into user code to free thread data. Without this it's possible
        // the unwind or ExitStatus exception could escape here.
        callUserCallback(() => cleanupThread(d.thread));
        break;

       case 3:
        onFinishedLoading(worker);
        break;

       case 9:
        Module[d.handler](...d.args);
        break;

       default:
        // The received message looks like something that should be handled by this message
        // handler, (since there is a e.data.cmd field present), but is not one of the
        // recognized commands:
        if (cmd) err(`worker sent an unknown command ${cmd}`);
      }
    };
    worker.onerror = e => {
      var message = "worker sent an error!";
      if (worker.pthread_ptr) {
        message = `Pthread ${ptrToString(worker.pthread_ptr)} sent an error!`;
      }
      err(`${message} ${e.filename}:${e.lineno}: ${e.message}`);
      throw e;
    };
    assert(wasmMemory instanceof WebAssembly.Memory, "wasmMemory should have been loaded by now");
    assert(wasmModule instanceof WebAssembly.Module, "wasmModule should have been loaded by now");
    // When running on a pthread, none of the incoming parameters on the module
    // object are present. Proxy known handlers back to the main thread if specified.
    var handlers = [];
    var knownHandlers = [ "onExit", "onAbort", "print", "printErr" ];
    for (var handler of knownHandlers) {
      if (Module.propertyIsEnumerable(handler)) {
        handlers.push(handler);
      }
    }
    // Ask the new worker to load up the Emscripten-compiled page. This is a heavy operation.
    worker.postMessage({
      cmd: 1,
      handlers,
      wasmMemory,
      wasmModule,
      workerID: worker.workerID
    });
  }),
  async loadWasmModuleToAllWorkers() {
    // Instantiation is synchronous in pthreads.
    if (ENVIRONMENT_IS_PTHREAD) {
      return;
    }
    let pthreadPoolReady = Promise.all(PThread.unusedWorkers.map(PThread.loadWasmModuleToWorker));
    return pthreadPoolReady;
  },
  allocateUnusedWorker() {
    var worker;
    var pthreadMainJs = _scriptName;
    // We can't use makeModuleReceiveWithVar here since we want to also
    // call URL.createObjectURL on the mainScriptUrlOrBlob.
    if (Module["mainScriptUrlOrBlob"]) {
      pthreadMainJs = Module["mainScriptUrlOrBlob"];
      if (typeof pthreadMainJs != "string") {
        pthreadMainJs = URL.createObjectURL(pthreadMainJs);
      }
    }
    worker = new Worker(pthreadMainJs, {
      // This is the way that we signal to the Web Worker that it is hosting
      // a pthread.
      "name": "em-pthread-" + PThread.nextWorkerID
    });
    worker.workerID = PThread.nextWorkerID++;
    PThread.unusedWorkers.push(worker);
    return worker;
  },
  getNewWorker() {
    if (PThread.unusedWorkers.length == 0) {
      // PTHREAD_POOL_SIZE_STRICT should show a warning and, if set to level `2`, return from the function.
      var newWorker = PThread.allocateUnusedWorker();
      PThread.loadWasmModuleToWorker(newWorker);
    }
    return PThread.unusedWorkers.pop();
  }
};

var onPostRuns = [];

var addOnPostRun = cb => onPostRuns.push(cb);

function establishStackSpace(pthread_ptr) {
  var stackHigh = (growMemViews(), HEAPU32)[(((pthread_ptr) + (48)) >>> 2) >>> 0];
  var stackSize = (growMemViews(), HEAPU32)[(((pthread_ptr) + (52)) >>> 2) >>> 0];
  var stackLow = stackHigh - stackSize;
  assert(stackHigh != 0);
  assert(stackLow != 0);
  assert(stackHigh > stackLow, "stackHigh must be higher then stackLow");
  // Set stack limits used by `emscripten/stack.h` function.  These limits are
  // cached in wasm-side globals to make checks as fast as possible.
  _emscripten_stack_set_limits(stackHigh, stackLow);
  // Call inside wasm module to set up the stack frame for this pthread in wasm module scope
  stackRestore(stackHigh);
  // Write the stack cookie last, after we have set up the proper bounds and
  // current position of the stack.
  writeStackCookie();
}

/**
   * @param {number} ptr
   * @param {string} type
   */ function getValue(ptr, type = "i8") {
  if (type.endsWith("*")) type = "*";
  switch (type) {
   case "i1":
    return (growMemViews(), HEAP8)[ptr >>> 0];

   case "i8":
    return (growMemViews(), HEAP8)[ptr >>> 0];

   case "i16":
    return (growMemViews(), HEAP16)[((ptr) >>> 1) >>> 0];

   case "i32":
    return (growMemViews(), HEAP32)[((ptr) >>> 2) >>> 0];

   case "i64":
    return (growMemViews(), HEAP64)[((ptr) >>> 3) >>> 0];

   case "float":
    return (growMemViews(), HEAPF32)[((ptr) >>> 2) >>> 0];

   case "double":
    return (growMemViews(), HEAPF64)[((ptr) >>> 3) >>> 0];

   case "*":
    return (growMemViews(), HEAPU32)[((ptr) >>> 2) >>> 0];

   default:
    abort(`invalid type for getValue: ${type}`);
  }
}

var wasmTableMirror = [];

var getWasmTableEntry = funcPtr => {
  var func = wasmTableMirror[funcPtr];
  if (!func) {
    /** @suppress {checkTypes} */ wasmTableMirror[funcPtr] = func = wasmTable.get(funcPtr);
  }
  /** @suppress {checkTypes} */ assert(wasmTable.get(funcPtr) == func, "table mirror is out of date");
  return func;
};

var invokeEntryPoint = (ptr, arg) => {
  // An old thread on this worker may have been canceled without returning the
  // `runtimeKeepaliveCounter` to zero. Reset it now so the new thread won't
  // be affected.
  runtimeKeepaliveCounter = 0;
  // Same for noExitRuntime.  The default for pthreads should always be false
  // otherwise pthreads would never complete and attempts to pthread_join to
  // them would block forever.
  // pthreads can still choose to set `noExitRuntime` explicitly, or
  // call emscripten_unwind_to_js_event_loop to extend their lifetime beyond
  // their main function.  See comment in src/runtime_pthread.js for more.
  noExitRuntime = 0;
  // pthread entry points are always of signature 'void *ThreadMain(void *arg)'
  // Native codebases sometimes spawn threads with other thread entry point
  // signatures, such as void ThreadMain(void *arg), void *ThreadMain(), or
  // void ThreadMain().  That is not acceptable per C/C++ specification, but
  // x86 compiler ABI extensions enable that to work. If you find the
  // following line to crash, either change the signature to "proper" void
  // *ThreadMain(void *arg) form, or try linking with the Emscripten linker
  // flag -sEMULATE_FUNCTION_POINTER_CASTS to add in emulation for this x86
  // ABI extension.
  var result = getWasmTableEntry(ptr)(arg);
  checkStackCookie();
  function finish(result) {
    // In MINIMAL_RUNTIME the noExitRuntime concept does not apply to
    // pthreads. To exit a pthread with live runtime, use the function
    // emscripten_unwind_to_js_event_loop() in the pthread body.
    if (keepRuntimeAlive()) {
      EXITSTATUS = result;
      return;
    }
    __emscripten_thread_exit(result);
  }
  finish(result);
};

var noExitRuntime = true;

var registerTLSInit = tlsInitFunc => PThread.tlsInitFunctions.push(tlsInitFunc);

/**
   * @param {number} ptr
   * @param {number} value
   * @param {string} type
   */ function setValue(ptr, value, type = "i8") {
  if (type.endsWith("*")) type = "*";
  switch (type) {
   case "i1":
    (growMemViews(), HEAP8)[ptr >>> 0] = value;
    break;

   case "i8":
    (growMemViews(), HEAP8)[ptr >>> 0] = value;
    break;

   case "i16":
    (growMemViews(), HEAP16)[((ptr) >>> 1) >>> 0] = value;
    break;

   case "i32":
    (growMemViews(), HEAP32)[((ptr) >>> 2) >>> 0] = value;
    break;

   case "i64":
    (growMemViews(), HEAP64)[((ptr) >>> 3) >>> 0] = BigInt(value);
    break;

   case "float":
    (growMemViews(), HEAPF32)[((ptr) >>> 2) >>> 0] = value;
    break;

   case "double":
    (growMemViews(), HEAPF64)[((ptr) >>> 3) >>> 0] = value;
    break;

   case "*":
    (growMemViews(), HEAPU32)[((ptr) >>> 2) >>> 0] = value;
    break;

   default:
    abort(`invalid type for setValue: ${type}`);
  }
}

var warnOnce = text => {
  warnOnce.shown ||= {};
  if (!warnOnce.shown[text]) {
    warnOnce.shown[text] = 1;
    err(text);
  }
};

var wasmMemory;

function _BZ2_bzCompress(...args) {
  abort("missing function: BZ2_bzCompress");
}

_BZ2_bzCompress.stub = true;

function _BZ2_bzCompressEnd(...args) {
  abort("missing function: BZ2_bzCompressEnd");
}

_BZ2_bzCompressEnd.stub = true;

function _BZ2_bzCompressInit(...args) {
  abort("missing function: BZ2_bzCompressInit");
}

_BZ2_bzCompressInit.stub = true;

function _BZ2_bzDecompress(...args) {
  abort("missing function: BZ2_bzDecompress");
}

_BZ2_bzDecompress.stub = true;

function _BZ2_bzDecompressEnd(...args) {
  abort("missing function: BZ2_bzDecompressEnd");
}

_BZ2_bzDecompressEnd.stub = true;

function _BZ2_bzDecompressInit(...args) {
  abort("missing function: BZ2_bzDecompressInit");
}

_BZ2_bzDecompressInit.stub = true;

function _BrotliDecoderDecompress(...args) {
  abort("missing function: BrotliDecoderDecompress");
}

_BrotliDecoderDecompress.stub = true;

function _PyExpat_XML_ErrorString(...args) {
  abort("missing function: PyExpat_XML_ErrorString");
}

_PyExpat_XML_ErrorString.stub = true;

function _PyExpat_XML_ExpatVersion(...args) {
  abort("missing function: PyExpat_XML_ExpatVersion");
}

_PyExpat_XML_ExpatVersion.stub = true;

function _PyExpat_XML_ExpatVersionInfo(...args) {
  abort("missing function: PyExpat_XML_ExpatVersionInfo");
}

_PyExpat_XML_ExpatVersionInfo.stub = true;

function _PyExpat_XML_ExternalEntityParserCreate(...args) {
  abort("missing function: PyExpat_XML_ExternalEntityParserCreate");
}

_PyExpat_XML_ExternalEntityParserCreate.stub = true;

function _PyExpat_XML_FreeContentModel(...args) {
  abort("missing function: PyExpat_XML_FreeContentModel");
}

_PyExpat_XML_FreeContentModel.stub = true;

function _PyExpat_XML_GetBase(...args) {
  abort("missing function: PyExpat_XML_GetBase");
}

_PyExpat_XML_GetBase.stub = true;

function _PyExpat_XML_GetBuffer(...args) {
  abort("missing function: PyExpat_XML_GetBuffer");
}

_PyExpat_XML_GetBuffer.stub = true;

function _PyExpat_XML_GetCurrentByteIndex(...args) {
  abort("missing function: PyExpat_XML_GetCurrentByteIndex");
}

_PyExpat_XML_GetCurrentByteIndex.stub = true;

function _PyExpat_XML_GetCurrentColumnNumber(...args) {
  abort("missing function: PyExpat_XML_GetCurrentColumnNumber");
}

_PyExpat_XML_GetCurrentColumnNumber.stub = true;

function _PyExpat_XML_GetCurrentLineNumber(...args) {
  abort("missing function: PyExpat_XML_GetCurrentLineNumber");
}

_PyExpat_XML_GetCurrentLineNumber.stub = true;

function _PyExpat_XML_GetErrorCode(...args) {
  abort("missing function: PyExpat_XML_GetErrorCode");
}

_PyExpat_XML_GetErrorCode.stub = true;

function _PyExpat_XML_GetFeatureList(...args) {
  abort("missing function: PyExpat_XML_GetFeatureList");
}

_PyExpat_XML_GetFeatureList.stub = true;

function _PyExpat_XML_GetInputContext(...args) {
  abort("missing function: PyExpat_XML_GetInputContext");
}

_PyExpat_XML_GetInputContext.stub = true;

function _PyExpat_XML_GetSpecifiedAttributeCount(...args) {
  abort("missing function: PyExpat_XML_GetSpecifiedAttributeCount");
}

_PyExpat_XML_GetSpecifiedAttributeCount.stub = true;

function _PyExpat_XML_Parse(...args) {
  abort("missing function: PyExpat_XML_Parse");
}

_PyExpat_XML_Parse.stub = true;

function _PyExpat_XML_ParseBuffer(...args) {
  abort("missing function: PyExpat_XML_ParseBuffer");
}

_PyExpat_XML_ParseBuffer.stub = true;

function _PyExpat_XML_ParserCreate_MM(...args) {
  abort("missing function: PyExpat_XML_ParserCreate_MM");
}

_PyExpat_XML_ParserCreate_MM.stub = true;

function _PyExpat_XML_ParserFree(...args) {
  abort("missing function: PyExpat_XML_ParserFree");
}

_PyExpat_XML_ParserFree.stub = true;

function _PyExpat_XML_SetAllocTrackerActivationThreshold(...args) {
  abort("missing function: PyExpat_XML_SetAllocTrackerActivationThreshold");
}

_PyExpat_XML_SetAllocTrackerActivationThreshold.stub = true;

function _PyExpat_XML_SetAllocTrackerMaximumAmplification(...args) {
  abort("missing function: PyExpat_XML_SetAllocTrackerMaximumAmplification");
}

_PyExpat_XML_SetAllocTrackerMaximumAmplification.stub = true;

function _PyExpat_XML_SetAttlistDeclHandler(...args) {
  abort("missing function: PyExpat_XML_SetAttlistDeclHandler");
}

_PyExpat_XML_SetAttlistDeclHandler.stub = true;

function _PyExpat_XML_SetBase(...args) {
  abort("missing function: PyExpat_XML_SetBase");
}

_PyExpat_XML_SetBase.stub = true;

function _PyExpat_XML_SetCharacterDataHandler(...args) {
  abort("missing function: PyExpat_XML_SetCharacterDataHandler");
}

_PyExpat_XML_SetCharacterDataHandler.stub = true;

function _PyExpat_XML_SetCommentHandler(...args) {
  abort("missing function: PyExpat_XML_SetCommentHandler");
}

_PyExpat_XML_SetCommentHandler.stub = true;

function _PyExpat_XML_SetDefaultHandler(...args) {
  abort("missing function: PyExpat_XML_SetDefaultHandler");
}

_PyExpat_XML_SetDefaultHandler.stub = true;

function _PyExpat_XML_SetDefaultHandlerExpand(...args) {
  abort("missing function: PyExpat_XML_SetDefaultHandlerExpand");
}

_PyExpat_XML_SetDefaultHandlerExpand.stub = true;

function _PyExpat_XML_SetElementDeclHandler(...args) {
  abort("missing function: PyExpat_XML_SetElementDeclHandler");
}

_PyExpat_XML_SetElementDeclHandler.stub = true;

function _PyExpat_XML_SetElementHandler(...args) {
  abort("missing function: PyExpat_XML_SetElementHandler");
}

_PyExpat_XML_SetElementHandler.stub = true;

function _PyExpat_XML_SetEncoding(...args) {
  abort("missing function: PyExpat_XML_SetEncoding");
}

_PyExpat_XML_SetEncoding.stub = true;

function _PyExpat_XML_SetEndCdataSectionHandler(...args) {
  abort("missing function: PyExpat_XML_SetEndCdataSectionHandler");
}

_PyExpat_XML_SetEndCdataSectionHandler.stub = true;

function _PyExpat_XML_SetEndDoctypeDeclHandler(...args) {
  abort("missing function: PyExpat_XML_SetEndDoctypeDeclHandler");
}

_PyExpat_XML_SetEndDoctypeDeclHandler.stub = true;

function _PyExpat_XML_SetEndElementHandler(...args) {
  abort("missing function: PyExpat_XML_SetEndElementHandler");
}

_PyExpat_XML_SetEndElementHandler.stub = true;

function _PyExpat_XML_SetEndNamespaceDeclHandler(...args) {
  abort("missing function: PyExpat_XML_SetEndNamespaceDeclHandler");
}

_PyExpat_XML_SetEndNamespaceDeclHandler.stub = true;

function _PyExpat_XML_SetEntityDeclHandler(...args) {
  abort("missing function: PyExpat_XML_SetEntityDeclHandler");
}

_PyExpat_XML_SetEntityDeclHandler.stub = true;

function _PyExpat_XML_SetExternalEntityRefHandler(...args) {
  abort("missing function: PyExpat_XML_SetExternalEntityRefHandler");
}

_PyExpat_XML_SetExternalEntityRefHandler.stub = true;

function _PyExpat_XML_SetHashSalt(...args) {
  abort("missing function: PyExpat_XML_SetHashSalt");
}

_PyExpat_XML_SetHashSalt.stub = true;

function _PyExpat_XML_SetNamespaceDeclHandler(...args) {
  abort("missing function: PyExpat_XML_SetNamespaceDeclHandler");
}

_PyExpat_XML_SetNamespaceDeclHandler.stub = true;

function _PyExpat_XML_SetNotStandaloneHandler(...args) {
  abort("missing function: PyExpat_XML_SetNotStandaloneHandler");
}

_PyExpat_XML_SetNotStandaloneHandler.stub = true;

function _PyExpat_XML_SetNotationDeclHandler(...args) {
  abort("missing function: PyExpat_XML_SetNotationDeclHandler");
}

_PyExpat_XML_SetNotationDeclHandler.stub = true;

function _PyExpat_XML_SetParamEntityParsing(...args) {
  abort("missing function: PyExpat_XML_SetParamEntityParsing");
}

_PyExpat_XML_SetParamEntityParsing.stub = true;

function _PyExpat_XML_SetProcessingInstructionHandler(...args) {
  abort("missing function: PyExpat_XML_SetProcessingInstructionHandler");
}

_PyExpat_XML_SetProcessingInstructionHandler.stub = true;

function _PyExpat_XML_SetReparseDeferralEnabled(...args) {
  abort("missing function: PyExpat_XML_SetReparseDeferralEnabled");
}

_PyExpat_XML_SetReparseDeferralEnabled.stub = true;

function _PyExpat_XML_SetReturnNSTriplet(...args) {
  abort("missing function: PyExpat_XML_SetReturnNSTriplet");
}

_PyExpat_XML_SetReturnNSTriplet.stub = true;

function _PyExpat_XML_SetSkippedEntityHandler(...args) {
  abort("missing function: PyExpat_XML_SetSkippedEntityHandler");
}

_PyExpat_XML_SetSkippedEntityHandler.stub = true;

function _PyExpat_XML_SetStartCdataSectionHandler(...args) {
  abort("missing function: PyExpat_XML_SetStartCdataSectionHandler");
}

_PyExpat_XML_SetStartCdataSectionHandler.stub = true;

function _PyExpat_XML_SetStartDoctypeDeclHandler(...args) {
  abort("missing function: PyExpat_XML_SetStartDoctypeDeclHandler");
}

_PyExpat_XML_SetStartDoctypeDeclHandler.stub = true;

function _PyExpat_XML_SetStartElementHandler(...args) {
  abort("missing function: PyExpat_XML_SetStartElementHandler");
}

_PyExpat_XML_SetStartElementHandler.stub = true;

function _PyExpat_XML_SetStartNamespaceDeclHandler(...args) {
  abort("missing function: PyExpat_XML_SetStartNamespaceDeclHandler");
}

_PyExpat_XML_SetStartNamespaceDeclHandler.stub = true;

function _PyExpat_XML_SetUnknownEncodingHandler(...args) {
  abort("missing function: PyExpat_XML_SetUnknownEncodingHandler");
}

_PyExpat_XML_SetUnknownEncodingHandler.stub = true;

function _PyExpat_XML_SetUnparsedEntityDeclHandler(...args) {
  abort("missing function: PyExpat_XML_SetUnparsedEntityDeclHandler");
}

_PyExpat_XML_SetUnparsedEntityDeclHandler.stub = true;

function _PyExpat_XML_SetUserData(...args) {
  abort("missing function: PyExpat_XML_SetUserData");
}

_PyExpat_XML_SetUserData.stub = true;

function _PyExpat_XML_SetXmlDeclHandler(...args) {
  abort("missing function: PyExpat_XML_SetXmlDeclHandler");
}

_PyExpat_XML_SetXmlDeclHandler.stub = true;

function _PyExpat_XML_StopParser(...args) {
  abort("missing function: PyExpat_XML_StopParser");
}

_PyExpat_XML_StopParser.stub = true;

function _PyExpat_XML_UseForeignDTD(...args) {
  abort("missing function: PyExpat_XML_UseForeignDTD");
}

_PyExpat_XML_UseForeignDTD.stub = true;

var INT53_MAX = 9007199254740992;

var INT53_MIN = -9007199254740992;

var bigintToI53Checked = num => (num < INT53_MIN || num > INT53_MAX) ? NaN : Number(num);

var UTF8Decoder = globalThis.TextDecoder && new TextDecoder;

var findStringEnd = (heapOrArray, idx, maxBytesToRead, ignoreNul) => {
  var maxIdx = idx + maxBytesToRead;
  if (ignoreNul) return maxIdx;
  // TextDecoder needs to know the byte length in advance, it doesn't stop on
  // null terminator by itself.
  // As a tiny code save trick, compare idx against maxIdx using a negation,
  // so that maxBytesToRead=undefined/NaN means Infinity.
  while (heapOrArray[idx] && !(idx >= maxIdx)) ++idx;
  return idx;
};

/**
   * Given a pointer 'idx' to a null-terminated UTF8-encoded string in the given
   * array that contains uint8 values, returns a copy of that string as a
   * Javascript String object.
   * heapOrArray is either a regular array, or a JavaScript typed array view.
   * @param {number=} idx
   * @param {number=} maxBytesToRead
   * @param {boolean=} ignoreNul - If true, the function will not stop on a NUL character.
   * @return {string}
   */ var UTF8ArrayToString = (heapOrArray, idx = 0, maxBytesToRead, ignoreNul) => {
  idx >>>= 0;
  var endPtr = findStringEnd(heapOrArray, idx, maxBytesToRead, ignoreNul);
  // When using conditional TextDecoder, skip it for short strings as the overhead of the native call is not worth it.
  if (endPtr - idx > 16 && heapOrArray.buffer && UTF8Decoder) {
    return UTF8Decoder.decode(heapOrArray.buffer instanceof ArrayBuffer ? heapOrArray.subarray(idx, endPtr) : heapOrArray.slice(idx, endPtr));
  }
  var str = "";
  while (idx < endPtr) {
    // For UTF8 byte structure, see:
    // http://en.wikipedia.org/wiki/UTF-8#Description
    // https://www.ietf.org/rfc/rfc2279.txt
    // https://tools.ietf.org/html/rfc3629
    var u0 = heapOrArray[idx++];
    if (!(u0 & 128)) {
      str += String.fromCharCode(u0);
      continue;
    }
    var u1 = heapOrArray[idx++] & 63;
    if ((u0 & 224) == 192) {
      str += String.fromCharCode(((u0 & 31) << 6) | u1);
      continue;
    }
    var u2 = heapOrArray[idx++] & 63;
    if ((u0 & 240) == 224) {
      u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
    } else {
      if ((u0 & 248) != 240) warnOnce(`Invalid UTF-8 leading byte ${ptrToString(u0)} encountered when deserializing a UTF-8 string in wasm memory to a JS string!`);
      u0 = ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | (heapOrArray[idx++] & 63);
    }
    if (u0 < 65536) {
      str += String.fromCharCode(u0);
    } else {
      var ch = u0 - 65536;
      str += String.fromCharCode(55296 | (ch >> 10), 56320 | (ch & 1023));
    }
  }
  return str;
};

/**
   * Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the
   * emscripten HEAP, returns a copy of that string as a Javascript String object.
   *
   * @param {number} ptr
   * @param {number=} maxBytesToRead - An optional length that specifies the
   *   maximum number of bytes to read. You can omit this parameter to scan the
   *   string until the first 0 byte. If maxBytesToRead is passed, and the string
   *   at [ptr, ptr+maxBytesToReadr[ contains a null byte in the middle, then the
   *   string will cut short at that byte index.
   * @param {boolean=} ignoreNul - If true, the function will not stop on a NUL character.
   * @return {string}
   */ var UTF8ToString = (ptr, maxBytesToRead, ignoreNul) => {
  assert(typeof ptr == "number", `UTF8ToString expects a number (got ${typeof ptr})`);
  ptr >>>= 0;
  return ptr ? UTF8ArrayToString((growMemViews(), HEAPU8), ptr, maxBytesToRead, ignoreNul) : "";
};

function ___assert_fail(condition, filename, line, func) {
  condition >>>= 0;
  filename >>>= 0;
  func >>>= 0;
  return abort(`Assertion failed: ${UTF8ToString(condition)}, at: ` + [ filename ? UTF8ToString(filename) : "unknown filename", line, func ? UTF8ToString(func) : "unknown function" ]);
}

function ___call_sighandler(fp, sig) {
  fp >>>= 0;
  return getWasmTableEntry(fp)(sig);
}

var exceptionCaught = [];

var uncaughtExceptionCount = 0;

function ___cxa_begin_catch(ptr) {
  ptr >>>= 0;
  var info = new ExceptionInfo(ptr);
  if (!info.get_caught()) {
    info.set_caught(true);
    uncaughtExceptionCount--;
  }
  info.set_rethrown(false);
  exceptionCaught.push(info);
  return ___cxa_get_exception_ptr(ptr);
}

function ___cxa_current_primary_exception() {
  if (!exceptionCaught.length) {
    return 0;
  }
  var info = exceptionCaught[exceptionCaught.length - 1];
  ___cxa_increment_exception_refcount(info.excPtr);
  return info.excPtr;
}

var exceptionLast = null;

var ___cxa_end_catch = () => {
  // Clear state flag.
  _setThrew(0, 0);
  assert(exceptionCaught.length > 0);
  // Call destructor if one is registered then clear it.
  var info = exceptionCaught.pop();
  ___cxa_decrement_exception_refcount(info.excPtr);
  exceptionLast = null;
};

class ExceptionInfo {
  // excPtr - Thrown object pointer to wrap. Metadata pointer is calculated from it.
  constructor(excPtr) {
    this.excPtr = excPtr;
    this.ptr = excPtr - 24;
  }
  set_type(type) {
    (growMemViews(), HEAPU32)[(((this.ptr) + (4)) >>> 2) >>> 0] = type;
  }
  get_type() {
    return (growMemViews(), HEAPU32)[(((this.ptr) + (4)) >>> 2) >>> 0];
  }
  set_destructor(destructor) {
    (growMemViews(), HEAPU32)[(((this.ptr) + (8)) >>> 2) >>> 0] = destructor;
  }
  get_destructor() {
    return (growMemViews(), HEAPU32)[(((this.ptr) + (8)) >>> 2) >>> 0];
  }
  set_caught(caught) {
    caught = caught ? 1 : 0;
    (growMemViews(), HEAP8)[(this.ptr) + (12) >>> 0] = caught;
  }
  get_caught() {
    return (growMemViews(), HEAP8)[(this.ptr) + (12) >>> 0] != 0;
  }
  set_rethrown(rethrown) {
    rethrown = rethrown ? 1 : 0;
    (growMemViews(), HEAP8)[(this.ptr) + (13) >>> 0] = rethrown;
  }
  get_rethrown() {
    return (growMemViews(), HEAP8)[(this.ptr) + (13) >>> 0] != 0;
  }
  // Initialize native structure fields. Should be called once after allocated.
  init(type, destructor) {
    this.set_adjusted_ptr(0);
    this.set_type(type);
    this.set_destructor(destructor);
  }
  set_adjusted_ptr(adjustedPtr) {
    (growMemViews(), HEAPU32)[(((this.ptr) + (16)) >>> 2) >>> 0] = adjustedPtr;
  }
  get_adjusted_ptr() {
    return (growMemViews(), HEAPU32)[(((this.ptr) + (16)) >>> 2) >>> 0];
  }
}

var setTempRet0 = val => __emscripten_tempret_set(val);

var findMatchingCatch = args => {
  var thrown = exceptionLast?.excPtr;
  if (!thrown) {
    // just pass through the null ptr
    setTempRet0(0);
    return 0;
  }
  var info = new ExceptionInfo(thrown);
  info.set_adjusted_ptr(thrown);
  var thrownType = info.get_type();
  if (!thrownType) {
    // just pass through the thrown ptr
    setTempRet0(0);
    return thrown;
  }
  // can_catch receives a **, add indirection
  // The different catch blocks are denoted by different types.
  // Due to inheritance, those types may not precisely match the
  // type of the thrown object. Find one which matches, and
  // return the type of the catch block which should be called.
  for (var caughtType of args) {
    if (caughtType === 0 || caughtType === thrownType) {
      // Catch all clause matched or exactly the same type is caught
      break;
    }
    var adjusted_ptr_addr = info.ptr + 16;
    if (___cxa_can_catch(caughtType, thrownType, adjusted_ptr_addr)) {
      setTempRet0(caughtType);
      return thrown;
    }
  }
  setTempRet0(thrownType);
  return thrown;
};

function ___cxa_find_matching_catch_2() {
  return findMatchingCatch([]);
}

function ___cxa_find_matching_catch_3(arg0) {
  arg0 >>>= 0;
  return findMatchingCatch([ arg0 ]);
}

function ___cxa_find_matching_catch_4(arg0, arg1) {
  arg0 >>>= 0;
  arg1 >>>= 0;
  return findMatchingCatch([ arg0, arg1 ]);
}

var ___cxa_rethrow = () => {
  if (!exceptionCaught.length) {
    abort("no exception to throw");
  }
  var info = exceptionCaught.at(-1);
  var ptr = info.excPtr;
  info.set_rethrown(true);
  info.set_caught(false);
  uncaughtExceptionCount++;
  ___cxa_increment_exception_refcount(ptr);
  exceptionLast = new CppException(ptr);
  throw exceptionLast;
};

function ___cxa_rethrow_primary_exception(ptr) {
  ptr >>>= 0;
  if (!ptr) return;
  var info = new ExceptionInfo(ptr);
  info.set_rethrown(true);
  info.set_caught(false);
  uncaughtExceptionCount++;
  ___cxa_increment_exception_refcount(ptr);
  exceptionLast = new CppException(ptr);
  throw exceptionLast;
}

var getExceptionMessageCommon = ptr => {
  var sp = stackSave();
  var type_addr_addr = stackAlloc(4);
  var message_addr_addr = stackAlloc(4);
  ___get_exception_message(ptr, type_addr_addr, message_addr_addr);
  var type_addr = (growMemViews(), HEAPU32)[((type_addr_addr) >>> 2) >>> 0];
  var message_addr = (growMemViews(), HEAPU32)[((message_addr_addr) >>> 2) >>> 0];
  var type = UTF8ToString(type_addr);
  _free(type_addr);
  var message;
  if (message_addr) {
    message = UTF8ToString(message_addr);
    _free(message_addr);
  }
  stackRestore(sp);
  return [ type, message ];
};

var getExceptionMessage = exn => getExceptionMessageCommon(exn.excPtr);

var decrementExceptionRefcount = exn => ___cxa_decrement_exception_refcount(exn.excPtr);

var incrementExceptionRefcount = exn => ___cxa_increment_exception_refcount(exn.excPtr);

function ___cxa_throw(ptr, type, destructor) {
  ptr >>>= 0;
  type >>>= 0;
  destructor >>>= 0;
  var info = new ExceptionInfo(ptr);
  // Initialize ExceptionInfo content after it was allocated in __cxa_allocate_exception.
  info.init(type, destructor);
  ___cxa_increment_exception_refcount(ptr);
  exceptionLast = new CppException(ptr);
  uncaughtExceptionCount++;
  throw exceptionLast;
}

var ___cxa_uncaught_exceptions = () => uncaughtExceptionCount;

function pthreadCreateProxied(pthread_ptr, attr, startRoutine, arg) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(2, 0, 1, pthread_ptr, attr, startRoutine, arg);
  return ___pthread_create_js(pthread_ptr, attr, startRoutine, arg);
}

var _emscripten_has_threading_support = () => !!globalThis.SharedArrayBuffer;

function ___pthread_create_js(pthread_ptr, attr, startRoutine, arg) {
  pthread_ptr >>>= 0;
  attr >>>= 0;
  startRoutine >>>= 0;
  arg >>>= 0;
  if (!_emscripten_has_threading_support()) {
    dbg("pthread_create: environment does not support SharedArrayBuffer, pthreads are not available");
    return 6;
  }
  // List of JS objects that will transfer ownership to the Worker hosting the thread
  var transferList = [];
  var error = 0;
  // Synchronously proxy the thread creation to main thread if possible. If we
  // need to transfer ownership of objects, then proxy asynchronously via
  // postMessage.
  if (ENVIRONMENT_IS_PTHREAD && (transferList.length === 0 || error)) {
    return pthreadCreateProxied(pthread_ptr, attr, startRoutine, arg);
  }
  // If on the main thread, and accessing Canvas/OffscreenCanvas failed, abort
  // with the detected error.
  if (error) return error;
  var threadParams = {
    startRoutine,
    pthread_ptr,
    arg,
    transferList
  };
  if (ENVIRONMENT_IS_PTHREAD) {
    // The prepopulated pool of web workers that can host pthreads is stored
    // in the main JS thread. Therefore if a pthread is attempting to spawn a
    // new thread, the thread creation must be deferred to the main JS thread.
    threadParams.cmd = 5;
    postMessage(threadParams, transferList);
    // When we defer thread creation this way, we have no way to detect thread
    // creation synchronously today, so we have to assume success and return 0.
    return 0;
  }
  // We are the main thread, so we have the pthread warmup pool in this
  // thread and can fire off JS thread creation directly ourselves.
  return spawnThread(threadParams);
}

function ___resumeException(ptr) {
  ptr >>>= 0;
  if (!exceptionLast) {
    exceptionLast = new CppException(ptr);
  }
  throw exceptionLast;
}

var __abort_js = () => abort("native code called abort()");

function __emscripten_init_main_thread_js(tb) {
  tb >>>= 0;
  var can_block = !ENVIRONMENT_IS_WEB;
  // Feature detect whether the main thread can block.
  try {
    Atomics.wait((growMemViews(), HEAP32), 0, 0, 0);
    can_block = true;
  } catch (e) {}
  // Pass the thread address to the native code where they are stored in wasm
  // globals which act as a form of TLS. Global constructors trying
  // to access this value will read the wrong value, but that is UB anyway.
  __emscripten_thread_init(tb, /*is_main=*/ !ENVIRONMENT_IS_WORKER, /*is_runtime=*/ 1, can_block, /*default_stacksize=*/ 4194304, /*start_profiling=*/ false);
  PThread.threadInitTLS();
}

var inetPton4 = str => {
  var b = str.split(".");
  for (var i = 0; i < 4; i++) {
    var tmp = Number(b[i]);
    if (isNaN(tmp)) return null;
    b[i] = tmp;
  }
  return (b[0] | (b[1] << 8) | (b[2] << 16) | (b[3] << 24)) >>> 0;
};

var inetPton6 = str => {
  var words;
  var w, offset, z, i;
  /* http://home.deds.nl/~aeron/regex/ */ var valid6regx = /^((?=.*::)(?!.*::.+::)(::)?([\dA-F]{1,4}:(:|\b)|){5}|([\dA-F]{1,4}:){6})((([\dA-F]{1,4}((?!\3)::|:\b|$))|(?!\2\3)){2}|(((2[0-4]|1\d|[1-9])?\d|25[0-5])\.?\b){4})$/i;
  var parts = [];
  if (!valid6regx.test(str)) {
    return null;
  }
  if (str === "::") {
    return [ 0, 0, 0, 0, 0, 0, 0, 0 ];
  }
  // Z placeholder to keep track of zeros when splitting the string on ":"
  if (str.startsWith("::")) {
    str = str.replace("::", "Z:");
  } else {
    str = str.replace("::", ":Z:");
  }
  if (str.indexOf(".") > 0) {
    // parse IPv4 embedded address
    str = str.replace(new RegExp("[.]", "g"), ":");
    words = str.split(":");
    words[words.length - 4] = Number(words[words.length - 4]) + Number(words[words.length - 3]) * 256;
    words[words.length - 3] = Number(words[words.length - 2]) + Number(words[words.length - 1]) * 256;
    words = words.slice(0, words.length - 2);
  } else {
    words = str.split(":");
  }
  offset = 0;
  z = 0;
  for (w = 0; w < words.length; w++) {
    if (typeof words[w] == "string") {
      if (words[w] === "Z") {
        // compressed zeros - write appropriate number of zero words
        for (z = 0; z < (8 - words.length + 1); z++) {
          parts[w + z] = 0;
        }
        offset = z - 1;
      } else {
        // parse hex field to 16-bit value and write it in network byte-order
        parts[w + offset] = _htons(parseInt(words[w], 16));
      }
    } else {
      // parsed IPv4 words
      parts[w + offset] = words[w];
    }
  }
  return [ (parts[1] << 16) | parts[0], (parts[3] << 16) | parts[2], (parts[5] << 16) | parts[4], (parts[7] << 16) | parts[6] ];
};

var DNS = {
  address_map: {
    id: 1,
    addrs: {},
    names: {}
  },
  lookup_name(name) {
    // If the name is already a valid ipv4 / ipv6 address, don't generate a fake one.
    var res = inetPton4(name);
    if (res !== null) {
      return name;
    }
    res = inetPton6(name);
    if (res !== null) {
      return name;
    }
    // See if this name is already mapped.
    var addr;
    if (DNS.address_map.addrs[name]) {
      addr = DNS.address_map.addrs[name];
    } else {
      var id = DNS.address_map.id++;
      assert(id < 65535, "exceeded max address mappings of 65535");
      addr = "172.29." + (id & 255) + "." + (id & 65280);
      DNS.address_map.names[addr] = name;
      DNS.address_map.addrs[name] = addr;
    }
    return addr;
  },
  lookup_addr(addr) {
    if (DNS.address_map.names[addr]) {
      return DNS.address_map.names[addr];
    }
    return null;
  }
};

function __emscripten_lookup_name(name) {
  name >>>= 0;
  // uint32_t _emscripten_lookup_name(const char *name);
  var nameString = UTF8ToString(name);
  return inetPton4(DNS.lookup_name(nameString));
}

var handleException = e => {
  // Certain exception types we do not treat as errors since they are used for
  // internal control flow.
  // 1. ExitStatus, which is thrown by exit()
  // 2. "unwind", which is thrown by emscripten_unwind_to_js_event_loop() and others
  //    that wish to return to JS event loop.
  if (e instanceof ExitStatus || e == "unwind") {
    return EXITSTATUS;
  }
  checkStackCookie();
  if (e instanceof WebAssembly.RuntimeError) {
    if (_emscripten_stack_get_current() <= 0) {
      err("Stack overflow detected.  You can try increasing -sSTACK_SIZE (currently set to 16777216)");
    }
  }
  quit_(1, e);
};

var maybeExit = () => {
  if (!keepRuntimeAlive()) {
    try {
      if (ENVIRONMENT_IS_PTHREAD) {
        // exit the current thread, but only if there is one active.
        // TODO(https://github.com/emscripten-core/emscripten/issues/25076):
        // Unify this check with the runtimeExited check above
        if (_pthread_self()) __emscripten_thread_exit(EXITSTATUS);
        return;
      }
      _exit(EXITSTATUS);
    } catch (e) {
      handleException(e);
    }
  }
};

var callUserCallback = func => {
  if (ABORT) {
    err("user callback triggered after runtime exited or application aborted.  Ignoring.");
    return;
  }
  try {
    return func();
  } catch (e) {
    handleException(e);
  } finally {
    maybeExit();
  }
};

function __emscripten_thread_mailbox_await(pthread_ptr) {
  pthread_ptr >>>= 0;
  if (!waitAsyncPolyfilled) {
    // Wait on the pthread's initial self-pointer field because it is easy and
    // safe to access from sending threads that need to notify the waiting
    // thread.
    // Note: Under wasm64 only the low 32-bit of the pthread_ptr are
    // read/compared here, but we don't actually care about the exact values
    // here as long as they match.
    var wait = Atomics.waitAsync((growMemViews(), HEAP32), ((pthread_ptr) >>> 2), pthread_ptr);
    assert(wait.async);
    wait.value.then(checkMailbox);
    var waitingAsync = pthread_ptr + 112;
    Atomics.store((growMemViews(), HEAP32), ((waitingAsync) >>> 2), 1);
  }
}

var checkMailbox = () => {
  // checkMailbox can be called after the pthread has shut down. See
  // Pthread.terminateRuntime().
  // In this case we return silently without re-registering using waitAsync.
  // Perhaps there is a more universal way we can detect runtime has exited.
  // TODO(https://github.com/emscripten-core/emscripten/issues/25076)
  var pthread_ptr = _pthread_self();
  if (!pthread_ptr) return;
  callUserCallback(() => {
    // If we are using Atomics.waitAsync as our notification mechanism, wait
    // for a notification before processing the mailbox to avoid missing any
    // work that could otherwise arrive after we've finished processing the
    // mailbox and before we're ready for the next notification.
    __emscripten_thread_mailbox_await(pthread_ptr);
    __emscripten_check_mailbox();
  });
};

function __emscripten_notify_mailbox_postmessage(targetThread, currThreadId) {
  targetThread >>>= 0;
  currThreadId >>>= 0;
  if (targetThread == currThreadId) {
    setTimeout(checkMailbox);
  } else if (ENVIRONMENT_IS_PTHREAD) {
    postMessage({
      targetThread,
      cmd: 4
    });
  } else {
    var worker = PThread.pthreads[targetThread];
    if (!worker) {
      err(`Cannot send message to thread with ID ${targetThread}, unknown thread ID!`);
      return;
    }
    worker.postMessage({
      cmd: 4
    });
  }
}

var proxiedJSCallArgs = [];

function __emscripten_receive_on_main_thread_js(funcIndex, emAsmAddr, callingThread, bufSize, args, ctx, ctxArgs) {
  emAsmAddr >>>= 0;
  callingThread >>>= 0;
  args >>>= 0;
  ctx >>>= 0;
  ctxArgs >>>= 0;
  // Sometimes we need to backproxy events to the calling thread (e.g.
  // HTML5 DOM events handlers such as
  // emscripten_set_mousemove_callback()), so keep track in a globally
  // accessible variable about the thread that initiated the proxying.
  proxiedJSCallArgs.length = 0;
  var b = ((args) >>> 3);
  var end = ((args + bufSize) >>> 3);
  while (b < end) {
    var arg;
    if ((growMemViews(), HEAP64)[b++ >>> 0]) {
      // It's a BigInt.
      arg = (growMemViews(), HEAP64)[b++ >>> 0];
    } else {
      // It's a Number.
      arg = (growMemViews(), HEAPF64)[b++ >>> 0];
    }
    proxiedJSCallArgs.push(arg);
  }
  // Proxied JS library funcs use funcIndex and EM_ASM functions use emAsmAddr
  var func = emAsmAddr ? ASM_CONSTS[emAsmAddr] : proxiedFunctionTable[funcIndex];
  assert(!(funcIndex && emAsmAddr));
  assert(func.length == proxiedJSCallArgs.length, "Call args mismatch in _emscripten_receive_on_main_thread_js");
  PThread.currentProxiedOperationCallerThread = callingThread;
  var rtn = func(...proxiedJSCallArgs);
  PThread.currentProxiedOperationCallerThread = 0;
  if (ctx) {
    rtn.then(rtn => __emscripten_run_js_on_main_thread_done(ctx, ctxArgs, rtn));
    return;
  }
  // Proxied functions can return any type except bigint.  All other types
  // coerce to f64/double (the return type of this function in C) but not
  // bigint.
  assert(typeof rtn != "bigint");
  return rtn;
}

var __emscripten_runtime_keepalive_clear = () => {
  noExitRuntime = false;
  runtimeKeepaliveCounter = 0;
};

function __emscripten_system(command) {
  command >>>= 0;
  // int system(const char *command);
  // http://pubs.opengroup.org/onlinepubs/000095399/functions/system.html
  // Can't call external programs.
  if (!command) return 0;
  // no shell available
  return -52;
}

function __emscripten_thread_cleanup(thread) {
  thread >>>= 0;
  // Called when a thread needs to be cleaned up so it can be reused.
  // A thread is considered reusable when it either returns from its
  // entry point, calls pthread_exit, or acts upon a cancellation.
  // Detached threads are responsible for calling this themselves,
  // otherwise pthread_join is responsible for calling this.
  if (!ENVIRONMENT_IS_PTHREAD) cleanupThread(thread); else postMessage({
    cmd: 6,
    thread
  });
}

function __emscripten_thread_set_strongref(thread) {
  thread >>>= 0;
}

var __emscripten_throw_longjmp = () => {
  throw new EmscriptenSjLj;
};

function __gmtime_js(time, tmPtr) {
  time = bigintToI53Checked(time);
  tmPtr >>>= 0;
  var date = new Date(time * 1e3);
  (growMemViews(), HEAP32)[((tmPtr) >>> 2) >>> 0] = date.getUTCSeconds();
  (growMemViews(), HEAP32)[(((tmPtr) + (4)) >>> 2) >>> 0] = date.getUTCMinutes();
  (growMemViews(), HEAP32)[(((tmPtr) + (8)) >>> 2) >>> 0] = date.getUTCHours();
  (growMemViews(), HEAP32)[(((tmPtr) + (12)) >>> 2) >>> 0] = date.getUTCDate();
  (growMemViews(), HEAP32)[(((tmPtr) + (16)) >>> 2) >>> 0] = date.getUTCMonth();
  (growMemViews(), HEAP32)[(((tmPtr) + (20)) >>> 2) >>> 0] = date.getUTCFullYear() - 1900;
  (growMemViews(), HEAP32)[(((tmPtr) + (24)) >>> 2) >>> 0] = date.getUTCDay();
  var start = Date.UTC(date.getUTCFullYear(), 0, 1, 0, 0, 0, 0);
  var yday = ((date.getTime() - start) / (1e3 * 60 * 60 * 24)) | 0;
  (growMemViews(), HEAP32)[(((tmPtr) + (28)) >>> 2) >>> 0] = yday;
}

var isLeapYear = year => year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);

var MONTH_DAYS_LEAP_CUMULATIVE = [ 0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335 ];

var MONTH_DAYS_REGULAR_CUMULATIVE = [ 0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334 ];

var ydayFromDate = date => {
  var leap = isLeapYear(date.getFullYear());
  var monthDaysCumulative = (leap ? MONTH_DAYS_LEAP_CUMULATIVE : MONTH_DAYS_REGULAR_CUMULATIVE);
  var yday = monthDaysCumulative[date.getMonth()] + date.getDate() - 1;
  // -1 since it's days since Jan 1
  return yday;
};

function __localtime_js(time, tmPtr) {
  time = bigintToI53Checked(time);
  tmPtr >>>= 0;
  var date = new Date(time * 1e3);
  (growMemViews(), HEAP32)[((tmPtr) >>> 2) >>> 0] = date.getSeconds();
  (growMemViews(), HEAP32)[(((tmPtr) + (4)) >>> 2) >>> 0] = date.getMinutes();
  (growMemViews(), HEAP32)[(((tmPtr) + (8)) >>> 2) >>> 0] = date.getHours();
  (growMemViews(), HEAP32)[(((tmPtr) + (12)) >>> 2) >>> 0] = date.getDate();
  (growMemViews(), HEAP32)[(((tmPtr) + (16)) >>> 2) >>> 0] = date.getMonth();
  (growMemViews(), HEAP32)[(((tmPtr) + (20)) >>> 2) >>> 0] = date.getFullYear() - 1900;
  (growMemViews(), HEAP32)[(((tmPtr) + (24)) >>> 2) >>> 0] = date.getDay();
  var yday = ydayFromDate(date) | 0;
  (growMemViews(), HEAP32)[(((tmPtr) + (28)) >>> 2) >>> 0] = yday;
  (growMemViews(), HEAP32)[(((tmPtr) + (36)) >>> 2) >>> 0] = -(date.getTimezoneOffset() * 60);
  // Attention: DST is in December in South, and some regions don't have DST at all.
  var start = new Date(date.getFullYear(), 0, 1);
  var summerOffset = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
  var winterOffset = start.getTimezoneOffset();
  var dst = (summerOffset != winterOffset && date.getTimezoneOffset() == Math.min(winterOffset, summerOffset)) | 0;
  (growMemViews(), HEAP32)[(((tmPtr) + (32)) >>> 2) >>> 0] = dst;
}

var __mktime_js = function(tmPtr) {
  tmPtr >>>= 0;
  var ret = (() => {
    var date = new Date((growMemViews(), HEAP32)[(((tmPtr) + (20)) >>> 2) >>> 0] + 1900, (growMemViews(), 
    HEAP32)[(((tmPtr) + (16)) >>> 2) >>> 0], (growMemViews(), HEAP32)[(((tmPtr) + (12)) >>> 2) >>> 0], (growMemViews(), 
    HEAP32)[(((tmPtr) + (8)) >>> 2) >>> 0], (growMemViews(), HEAP32)[(((tmPtr) + (4)) >>> 2) >>> 0], (growMemViews(), 
    HEAP32)[((tmPtr) >>> 2) >>> 0], 0);
    if (isNaN(date.getTime())) {
      return -1;
    }
    // There's an ambiguous hour when the time goes back; the tm_isdst field is
    // used to disambiguate it.  Date() basically guesses, so we fix it up if it
    // guessed wrong, or fill in tm_isdst with the guess if it's -1.
    var dst = (growMemViews(), HEAP32)[(((tmPtr) + (32)) >>> 2) >>> 0];
    var guessedOffset = date.getTimezoneOffset();
    var start = new Date(date.getFullYear(), 0, 1);
    var summerOffset = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
    var winterOffset = start.getTimezoneOffset();
    var dstOffset = Math.min(winterOffset, summerOffset);
    // DST is in December in South
    if (dst < 0) {
      // Attention: some regions don't have DST at all.
      (growMemViews(), HEAP32)[(((tmPtr) + (32)) >>> 2) >>> 0] = Number(summerOffset != winterOffset && dstOffset == guessedOffset);
    } else if ((dst > 0) != (dstOffset == guessedOffset)) {
      var nonDstOffset = Math.max(winterOffset, summerOffset);
      var trueOffset = dst > 0 ? dstOffset : nonDstOffset;
      // Don't try setMinutes(date.getMinutes() + ...) -- it's messed up.
      date.setTime(date.getTime() + (trueOffset - guessedOffset) * 6e4);
    }
    (growMemViews(), HEAP32)[(((tmPtr) + (24)) >>> 2) >>> 0] = date.getDay();
    var yday = ydayFromDate(date) | 0;
    (growMemViews(), HEAP32)[(((tmPtr) + (28)) >>> 2) >>> 0] = yday;
    // To match expected behavior, update fields from date
    (growMemViews(), HEAP32)[((tmPtr) >>> 2) >>> 0] = date.getSeconds();
    (growMemViews(), HEAP32)[(((tmPtr) + (4)) >>> 2) >>> 0] = date.getMinutes();
    (growMemViews(), HEAP32)[(((tmPtr) + (8)) >>> 2) >>> 0] = date.getHours();
    (growMemViews(), HEAP32)[(((tmPtr) + (12)) >>> 2) >>> 0] = date.getDate();
    (growMemViews(), HEAP32)[(((tmPtr) + (16)) >>> 2) >>> 0] = date.getMonth();
    (growMemViews(), HEAP32)[(((tmPtr) + (20)) >>> 2) >>> 0] = date.getYear();
    // Return time in seconds
    return date.getTime() / 1e3;
  })();
  return BigInt(ret);
};

var timers = {};

var clearTimers = () => {
  for (var t of Object.values(timers)) {
    clearTimeout(t.id);
  }
};

var _emscripten_get_now = () => performance.timeOrigin + performance.now();

function __setitimer_js(which, timeout_ms) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(3, 0, 1, which, timeout_ms);
  // First, clear any existing timer.
  if (timers[which]) {
    clearTimeout(timers[which].id);
    delete timers[which];
  }
  // A timeout of zero simply cancels the current timeout so we have nothing
  // more to do.
  if (!timeout_ms) return 0;
  var id = setTimeout(() => {
    assert(which in timers);
    delete timers[which];
    callUserCallback(() => __emscripten_timeout(which, _emscripten_get_now()));
  }, timeout_ms);
  timers[which] = {
    id,
    timeout_ms
  };
  return 0;
}

var stringToUTF8Array = (str, heap, outIdx, maxBytesToWrite) => {
  outIdx >>>= 0;
  assert(typeof str === "string", `stringToUTF8Array expects a string (got ${typeof str})`);
  // Parameter maxBytesToWrite is not optional. Negative values, 0, null,
  // undefined and false each don't write out any bytes.
  if (!(maxBytesToWrite > 0)) return 0;
  var startIdx = outIdx;
  var endIdx = outIdx + maxBytesToWrite - 1;
  // -1 for string null terminator.
  for (var i = 0; i < str.length; ++i) {
    // For UTF8 byte structure, see http://en.wikipedia.org/wiki/UTF-8#Description
    // and https://www.ietf.org/rfc/rfc2279.txt
    // and https://tools.ietf.org/html/rfc3629
    var u = str.codePointAt(i);
    if (u <= 127) {
      if (outIdx >= endIdx) break;
      heap[outIdx++ >>> 0] = u;
    } else if (u <= 2047) {
      if (outIdx + 1 >= endIdx) break;
      heap[outIdx++ >>> 0] = 192 | (u >> 6);
      heap[outIdx++ >>> 0] = 128 | (u & 63);
    } else if (u <= 65535) {
      if (outIdx + 2 >= endIdx) break;
      heap[outIdx++ >>> 0] = 224 | (u >> 12);
      heap[outIdx++ >>> 0] = 128 | ((u >> 6) & 63);
      heap[outIdx++ >>> 0] = 128 | (u & 63);
    } else {
      if (outIdx + 3 >= endIdx) break;
      if (u > 1114111) warnOnce(`Invalid Unicode code point ${ptrToString(u)} encountered when serializing a JS string to a UTF-8 string in wasm memory! (Valid unicode code points should be in range 0-0x10FFFF).`);
      heap[outIdx++ >>> 0] = 240 | (u >> 18);
      heap[outIdx++ >>> 0] = 128 | ((u >> 12) & 63);
      heap[outIdx++ >>> 0] = 128 | ((u >> 6) & 63);
      heap[outIdx++ >>> 0] = 128 | (u & 63);
      // Gotcha: if codePoint is over 0xFFFF, it is represented as a surrogate pair in UTF-16.
      // We need to manually skip over the second code unit for correct iteration.
      i++;
    }
  }
  // Null-terminate the pointer to the buffer.
  heap[outIdx >>> 0] = 0;
  return outIdx - startIdx;
};

var stringToUTF8 = (str, outPtr, maxBytesToWrite) => {
  assert(typeof maxBytesToWrite == "number", "stringToUTF8 requires a third parameter that specifies the length of the output buffer");
  return stringToUTF8Array(str, (growMemViews(), HEAPU8), outPtr, maxBytesToWrite);
};

var lengthBytesUTF8 = str => {
  var len = 0;
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code
    // unit, not a Unicode code point of the character! So decode
    // UTF16->UTF32->UTF8.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    var c = str.charCodeAt(i);
    // possibly a lead surrogate
    if (c <= 127) {
      len++;
    } else if (c <= 2047) {
      len += 2;
    } else if (c >= 55296 && c <= 57343) {
      len += 4;
      ++i;
    } else {
      len += 3;
    }
  }
  return len;
};

var __tzset_js = function(timezone, daylight, std_name, dst_name) {
  timezone >>>= 0;
  daylight >>>= 0;
  std_name >>>= 0;
  dst_name >>>= 0;
  // TODO: Use (malleable) environment variables instead of system settings.
  var currentYear = (new Date).getFullYear();
  var winter = new Date(currentYear, 0, 1);
  var summer = new Date(currentYear, 6, 1);
  var winterOffset = winter.getTimezoneOffset();
  var summerOffset = summer.getTimezoneOffset();
  // Local standard timezone offset. Local standard time is not adjusted for
  // daylight savings.  This code uses the fact that getTimezoneOffset returns
  // a greater value during Standard Time versus Daylight Saving Time (DST).
  // Thus it determines the expected output during Standard Time, and it
  // compares whether the output of the given date the same (Standard) or less
  // (DST).
  var stdTimezoneOffset = Math.max(winterOffset, summerOffset);
  // timezone is specified as seconds west of UTC ("The external variable
  // `timezone` shall be set to the difference, in seconds, between
  // Coordinated Universal Time (UTC) and local standard time."), the same
  // as returned by stdTimezoneOffset.
  // See http://pubs.opengroup.org/onlinepubs/009695399/functions/tzset.html
  (growMemViews(), HEAPU32)[((timezone) >>> 2) >>> 0] = stdTimezoneOffset * 60;
  (growMemViews(), HEAP32)[((daylight) >>> 2) >>> 0] = Number(winterOffset != summerOffset);
  var extractZone = timezoneOffset => {
    // Why inverse sign?
    // Read here https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getTimezoneOffset
    var sign = timezoneOffset >= 0 ? "-" : "+";
    var absOffset = Math.abs(timezoneOffset);
    var hours = String(Math.floor(absOffset / 60)).padStart(2, "0");
    var minutes = String(absOffset % 60).padStart(2, "0");
    return `UTC${sign}${hours}${minutes}`;
  };
  var winterName = extractZone(winterOffset);
  var summerName = extractZone(summerOffset);
  assert(winterName);
  assert(summerName);
  assert(lengthBytesUTF8(winterName) <= 16, `timezone name truncated to fit in TZNAME_MAX (${winterName})`);
  assert(lengthBytesUTF8(summerName) <= 16, `timezone name truncated to fit in TZNAME_MAX (${summerName})`);
  if (summerOffset < winterOffset) {
    // Northern hemisphere
    stringToUTF8(winterName, std_name, 17);
    stringToUTF8(summerName, dst_name, 17);
  } else {
    stringToUTF8(winterName, dst_name, 17);
    stringToUTF8(summerName, std_name, 17);
  }
};

function __wasmfs_copy_preloaded_file_data(index, buffer) {
  buffer >>>= 0;
  return (growMemViews(), HEAPU8).set(wasmFSPreloadedFiles[index].fileData, buffer >>> 0);
}

var wasmFSPreloadedDirs = [];

var __wasmfs_get_num_preloaded_dirs = () => wasmFSPreloadedDirs.length;

var wasmFSPreloadedFiles = [];

var wasmFSPreloadingFlushed = false;

var __wasmfs_get_num_preloaded_files = () => {
  // When this method is called from WasmFS it means that we are about to
  // flush all the preloaded data, so mark that. (There is no call that
  // occurs at the end of that flushing, which would be more natural, but it
  // is fine to mark the flushing here as during the flushing itself no user
  // code can run, so nothing will check whether we have flushed or not.)
  wasmFSPreloadingFlushed = true;
  return wasmFSPreloadedFiles.length;
};

function __wasmfs_get_preloaded_child_path(index, childNameBuffer) {
  childNameBuffer >>>= 0;
  var s = wasmFSPreloadedDirs[index].childName;
  var len = lengthBytesUTF8(s) + 1;
  stringToUTF8(s, childNameBuffer, len);
}

var __wasmfs_get_preloaded_file_mode = index => wasmFSPreloadedFiles[index].mode;

function __wasmfs_get_preloaded_file_size(index) {
  return wasmFSPreloadedFiles[index].fileData.length;
}

function __wasmfs_get_preloaded_parent_path(index, parentPathBuffer) {
  parentPathBuffer >>>= 0;
  var s = wasmFSPreloadedDirs[index].parentPath;
  var len = lengthBytesUTF8(s) + 1;
  stringToUTF8(s, parentPathBuffer, len);
}

function __wasmfs_get_preloaded_path_name(index, fileNameBuffer) {
  fileNameBuffer >>>= 0;
  var s = wasmFSPreloadedFiles[index].pathName;
  var len = lengthBytesUTF8(s) + 1;
  stringToUTF8(s, fileNameBuffer, len);
}

function __wasmfs_jsimpl_alloc_file(backend, file) {
  backend >>>= 0;
  file >>>= 0;
  assert(wasmFS$backends[backend]);
  return wasmFS$backends[backend].allocFile(file);
}

function __wasmfs_jsimpl_free_file(backend, file) {
  backend >>>= 0;
  file >>>= 0;
  assert(wasmFS$backends[backend]);
  return wasmFS$backends[backend].freeFile(file);
}

function __wasmfs_jsimpl_get_size(backend, file) {
  backend >>>= 0;
  file >>>= 0;
  assert(wasmFS$backends[backend]);
  return wasmFS$backends[backend].getSize(file);
}

function __wasmfs_jsimpl_read(backend, file, buffer, length, offset) {
  backend >>>= 0;
  file >>>= 0;
  buffer >>>= 0;
  length >>>= 0;
  offset = bigintToI53Checked(offset);
  assert(wasmFS$backends[backend]);
  if (!wasmFS$backends[backend].read) {
    return -28;
  }
  return wasmFS$backends[backend].read(file, buffer, length, offset);
}

function __wasmfs_jsimpl_set_size(backend, file, size) {
  backend >>>= 0;
  file >>>= 0;
  size = bigintToI53Checked(size);
  assert(wasmFS$backends[backend]);
  return wasmFS$backends[backend].setSize(file, size);
}

function __wasmfs_jsimpl_write(backend, file, buffer, length, offset) {
  backend >>>= 0;
  file >>>= 0;
  buffer >>>= 0;
  length >>>= 0;
  offset = bigintToI53Checked(offset);
  assert(wasmFS$backends[backend]);
  if (!wasmFS$backends[backend].write) {
    return -28;
  }
  return wasmFS$backends[backend].write(file, buffer, length, offset);
}

class HandleAllocator {
  allocated=[ undefined ];
  freelist=[];
  get(id) {
    assert(this.allocated[id] !== undefined, `invalid handle: ${id}`);
    return this.allocated[id];
  }
  has(id) {
    return this.allocated[id] !== undefined;
  }
  allocate(handle) {
    var id = this.freelist.pop() ?? this.allocated.length;
    this.allocated[id] = handle;
    return id;
  }
  free(id) {
    assert(this.allocated[id] !== undefined);
    // Set the slot to `undefined` rather than using `delete` here since
    // apparently arrays with holes in them can be less efficient.
    this.allocated[id] = undefined;
    this.freelist.push(id);
  }
}

var wasmfsOPFSAccessHandles = new HandleAllocator;

var wasmfsOPFSProxyFinish = ctx => {
  // When using pthreads the proxy needs to know when the work is finished.
  // When used with JSPI the work will be executed in an async block so there
  // is no need to notify when done.
  _emscripten_proxy_finish(ctx);
};

async function __wasmfs_opfs_close_access(ctx, accessID, errPtr) {
  ctx >>>= 0;
  errPtr >>>= 0;
  let accessHandle = wasmfsOPFSAccessHandles.get(accessID);
  try {
    await accessHandle.close();
  } catch {
    let err = -29;
    (growMemViews(), HEAP32)[((errPtr) >>> 2) >>> 0] = err;
  }
  wasmfsOPFSAccessHandles.free(accessID);
  wasmfsOPFSProxyFinish(ctx);
}

var wasmfsOPFSBlobs = new HandleAllocator;

var __wasmfs_opfs_close_blob = blobID => {
  wasmfsOPFSBlobs.free(blobID);
};

async function __wasmfs_opfs_flush_access(ctx, accessID, errPtr) {
  ctx >>>= 0;
  errPtr >>>= 0;
  let accessHandle = wasmfsOPFSAccessHandles.get(accessID);
  try {
    await accessHandle.flush();
  } catch {
    let err = -29;
    (growMemViews(), HEAP32)[((errPtr) >>> 2) >>> 0] = err;
  }
  wasmfsOPFSProxyFinish(ctx);
}

var wasmfsOPFSDirectoryHandles = new HandleAllocator;

var __wasmfs_opfs_free_directory = dirID => {
  wasmfsOPFSDirectoryHandles.free(dirID);
};

var wasmfsOPFSFileHandles = new HandleAllocator;

var __wasmfs_opfs_free_file = fileID => {
  wasmfsOPFSFileHandles.free(fileID);
};

var wasmfsOPFSGetOrCreateFile = async (parent, name, create) => {
  let parentHandle = wasmfsOPFSDirectoryHandles.get(parent);
  let fileHandle;
  try {
    fileHandle = await parentHandle.getFileHandle(name, {
      create
    });
  } catch (e) {
    if (e.name === "NotFoundError") {
      return -20;
    }
    if (e.name === "TypeMismatchError") {
      return -31;
    }
    err("unexpected error:", e, e.stack);
    return -29;
  }
  return wasmfsOPFSFileHandles.allocate(fileHandle);
};

var wasmfsOPFSGetOrCreateDir = async (parent, name, create) => {
  let parentHandle = wasmfsOPFSDirectoryHandles.get(parent);
  let childHandle;
  try {
    childHandle = await parentHandle.getDirectoryHandle(name, {
      create
    });
  } catch (e) {
    if (e.name === "NotFoundError") {
      return -20;
    }
    if (e.name === "TypeMismatchError") {
      return -54;
    }
    err("unexpected error:", e, e.stack);
    return -29;
  }
  return wasmfsOPFSDirectoryHandles.allocate(childHandle);
};

async function __wasmfs_opfs_get_child(ctx, parent, namePtr, childTypePtr, childIDPtr) {
  ctx >>>= 0;
  namePtr >>>= 0;
  childTypePtr >>>= 0;
  childIDPtr >>>= 0;
  let name = UTF8ToString(namePtr);
  let childType = 1;
  let childID = await wasmfsOPFSGetOrCreateFile(parent, name, false);
  if (childID == -31) {
    childType = 2;
    childID = await wasmfsOPFSGetOrCreateDir(parent, name, false);
  }
  (growMemViews(), HEAP32)[((childTypePtr) >>> 2) >>> 0] = childType;
  (growMemViews(), HEAP32)[((childIDPtr) >>> 2) >>> 0] = childID;
  wasmfsOPFSProxyFinish(ctx);
}

async function __wasmfs_opfs_get_entries(ctx, dirID, entriesPtr, errPtr) {
  ctx >>>= 0;
  entriesPtr >>>= 0;
  errPtr >>>= 0;
  let dirHandle = wasmfsOPFSDirectoryHandles.get(dirID);
  // TODO: Use 'for await' once Acorn supports that.
  try {
    let iter = dirHandle.entries();
    for (let entry; entry = await iter.next(), !entry.done; ) {
      let [name, child] = entry.value;
      let sp = stackSave();
      let namePtr = stringToUTF8OnStack(name);
      let type = child.kind == "file" ? 1 : 2;
      __wasmfs_opfs_record_entry(entriesPtr, namePtr, type);
      stackRestore(sp);
    }
  } catch {
    let err = -29;
    (growMemViews(), HEAP32)[((errPtr) >>> 2) >>> 0] = err;
  }
  wasmfsOPFSProxyFinish(ctx);
}

async function __wasmfs_opfs_get_size_access(ctx, accessID, sizePtr) {
  ctx >>>= 0;
  sizePtr >>>= 0;
  let accessHandle = wasmfsOPFSAccessHandles.get(accessID);
  let size;
  try {
    size = await accessHandle.getSize();
  } catch {
    size = -29;
  }
  (growMemViews(), HEAP64)[((sizePtr) >>> 3) >>> 0] = BigInt(size);
  wasmfsOPFSProxyFinish(ctx);
}

var __wasmfs_opfs_get_size_blob = function(blobID) {
  var ret = (() => wasmfsOPFSBlobs.get(blobID).size)();
  return BigInt(ret);
};

async function __wasmfs_opfs_get_size_file(ctx, fileID, sizePtr) {
  ctx >>>= 0;
  sizePtr >>>= 0;
  let fileHandle = wasmfsOPFSFileHandles.get(fileID);
  let size;
  try {
    size = (await fileHandle.getFile()).size;
  } catch {
    size = -29;
  }
  (growMemViews(), HEAP64)[((sizePtr) >>> 3) >>> 0] = BigInt(size);
  wasmfsOPFSProxyFinish(ctx);
}

async function __wasmfs_opfs_init_root_directory(ctx) {
  ctx >>>= 0;
  // allocated.length starts off as 1 since 0 is a reserved handle
  if (wasmfsOPFSDirectoryHandles.allocated.length == 1) {
    // Closure compiler errors on this as it does not recognize the OPFS
    // API yet, it seems. Unfortunately an existing annotation for this is in
    // the closure compiler codebase, and cannot be overridden in user code
    // (it complains on a duplicate type annotation), so just suppress it.
    /** @suppress {checkTypes} */ let root = await navigator.storage.getDirectory();
    wasmfsOPFSDirectoryHandles.allocated.push(root);
  }
  wasmfsOPFSProxyFinish(ctx);
}

async function __wasmfs_opfs_insert_directory(ctx, parent, namePtr, childIDPtr) {
  ctx >>>= 0;
  namePtr >>>= 0;
  childIDPtr >>>= 0;
  let name = UTF8ToString(namePtr);
  let childID = await wasmfsOPFSGetOrCreateDir(parent, name, true);
  (growMemViews(), HEAP32)[((childIDPtr) >>> 2) >>> 0] = childID;
  wasmfsOPFSProxyFinish(ctx);
}

async function __wasmfs_opfs_insert_file(ctx, parent, namePtr, childIDPtr) {
  ctx >>>= 0;
  namePtr >>>= 0;
  childIDPtr >>>= 0;
  let name = UTF8ToString(namePtr);
  let childID = await wasmfsOPFSGetOrCreateFile(parent, name, true);
  (growMemViews(), HEAP32)[((childIDPtr) >>> 2) >>> 0] = childID;
  wasmfsOPFSProxyFinish(ctx);
}

async function __wasmfs_opfs_move_file(ctx, fileID, newParentID, namePtr, errPtr) {
  ctx >>>= 0;
  namePtr >>>= 0;
  errPtr >>>= 0;
  let name = UTF8ToString(namePtr);
  let fileHandle = wasmfsOPFSFileHandles.get(fileID);
  let newDirHandle = wasmfsOPFSDirectoryHandles.get(newParentID);
  try {
    await fileHandle.move(newDirHandle, name);
  } catch {
    let err = -29;
    (growMemViews(), HEAP32)[((errPtr) >>> 2) >>> 0] = err;
  }
  wasmfsOPFSProxyFinish(ctx);
}

async function __wasmfs_opfs_open_access(ctx, fileID, accessIDPtr) {
  ctx >>>= 0;
  accessIDPtr >>>= 0;
  let fileHandle = wasmfsOPFSFileHandles.get(fileID);
  let accessID;
  try {
    let accessHandle;
    // TODO: Remove this once the Access Handles API has settled.
    // TODO: Closure is confused by this code that supports two versions of
    //       the same API, so suppress type checking on it.
    /** @suppress {checkTypes} */ var len = FileSystemFileHandle.prototype.createSyncAccessHandle.length;
    if (len == 0) {
      accessHandle = await fileHandle.createSyncAccessHandle();
    } else {
      accessHandle = await fileHandle.createSyncAccessHandle({
        mode: "in-place"
      });
    }
    accessID = wasmfsOPFSAccessHandles.allocate(accessHandle);
  } catch (e) {
    // TODO: Presumably only one of these will appear in the final API?
    if (e.name === "InvalidStateError" || e.name === "NoModificationAllowedError") {
      accessID = -2;
    } else {
      err("unexpected error:", e, e.stack);
      accessID = -29;
    }
  }
  (growMemViews(), HEAP32)[((accessIDPtr) >>> 2) >>> 0] = accessID;
  wasmfsOPFSProxyFinish(ctx);
}

async function __wasmfs_opfs_open_blob(ctx, fileID, blobIDPtr) {
  ctx >>>= 0;
  blobIDPtr >>>= 0;
  let fileHandle = wasmfsOPFSFileHandles.get(fileID);
  let blobID;
  try {
    let blob = await fileHandle.getFile();
    blobID = wasmfsOPFSBlobs.allocate(blob);
  } catch (e) {
    if (e.name === "NotAllowedError") {
      blobID = -2;
    } else {
      err("unexpected error:", e, e.stack);
      blobID = -29;
    }
  }
  (growMemViews(), HEAP32)[((blobIDPtr) >>> 2) >>> 0] = blobID;
  wasmfsOPFSProxyFinish(ctx);
}

function __wasmfs_opfs_read_access(accessID, bufPtr, len, pos) {
  bufPtr >>>= 0;
  pos = bigintToI53Checked(pos);
  let accessHandle = wasmfsOPFSAccessHandles.get(accessID);
  let data = (growMemViews(), HEAPU8).subarray(bufPtr >>> 0, bufPtr + len >>> 0);
  try {
    return accessHandle.read(data, {
      at: pos
    });
  } catch (e) {
    if (e.name == "TypeError") {
      return -28;
    }
    err("unexpected error:", e, e.stack);
    return -29;
  }
}

async function __wasmfs_opfs_read_blob(ctx, blobID, bufPtr, len, pos, nreadPtr) {
  ctx >>>= 0;
  bufPtr >>>= 0;
  pos = bigintToI53Checked(pos);
  nreadPtr >>>= 0;
  let blob = wasmfsOPFSBlobs.get(blobID);
  let slice = blob.slice(pos, pos + len);
  let nread = 0;
  try {
    // TODO: Use ReadableStreamBYOBReader once
    // https://bugs.chromium.org/p/chromium/issues/detail?id=1189621 is
    // resolved.
    let buf = await slice.arrayBuffer();
    let data = new Uint8Array(buf);
    (growMemViews(), HEAPU8).set(data, bufPtr >>> 0);
    nread += data.length;
  } catch (e) {
    if (e instanceof RangeError) {
      nread = -21;
    } else {
      err("unexpected error:", e, e.stack);
      nread = -29;
    }
  }
  (growMemViews(), HEAP32)[((nreadPtr) >>> 2) >>> 0] = nread;
  wasmfsOPFSProxyFinish(ctx);
}

async function __wasmfs_opfs_remove_child(ctx, dirID, namePtr, errPtr) {
  ctx >>>= 0;
  namePtr >>>= 0;
  errPtr >>>= 0;
  let name = UTF8ToString(namePtr);
  let dirHandle = wasmfsOPFSDirectoryHandles.get(dirID);
  try {
    await dirHandle.removeEntry(name);
  } catch {
    let err = -29;
    (growMemViews(), HEAP32)[((errPtr) >>> 2) >>> 0] = err;
  }
  wasmfsOPFSProxyFinish(ctx);
}

async function __wasmfs_opfs_set_size_access(ctx, accessID, size, errPtr) {
  ctx >>>= 0;
  size = bigintToI53Checked(size);
  errPtr >>>= 0;
  let accessHandle = wasmfsOPFSAccessHandles.get(accessID);
  try {
    await accessHandle.truncate(size);
  } catch {
    let err = -29;
    (growMemViews(), HEAP32)[((errPtr) >>> 2) >>> 0] = err;
  }
  wasmfsOPFSProxyFinish(ctx);
}

async function __wasmfs_opfs_set_size_file(ctx, fileID, size, errPtr) {
  ctx >>>= 0;
  size = bigintToI53Checked(size);
  errPtr >>>= 0;
  let fileHandle = wasmfsOPFSFileHandles.get(fileID);
  try {
    let writable = await fileHandle.createWritable({
      keepExistingData: true
    });
    await writable.truncate(size);
    await writable.close();
  } catch {
    let err = -29;
    (growMemViews(), HEAP32)[((errPtr) >>> 2) >>> 0] = err;
  }
  wasmfsOPFSProxyFinish(ctx);
}

function __wasmfs_opfs_write_access(accessID, bufPtr, len, pos) {
  bufPtr >>>= 0;
  pos = bigintToI53Checked(pos);
  let accessHandle = wasmfsOPFSAccessHandles.get(accessID);
  let data = (growMemViews(), HEAPU8).subarray(bufPtr >>> 0, bufPtr + len >>> 0);
  try {
    return accessHandle.write(data, {
      at: pos
    });
  } catch (e) {
    if (e.name == "TypeError") {
      return -28;
    }
    err("unexpected error:", e, e.stack);
    return -29;
  }
}

var FS_stdin_getChar_buffer = [];

/** @type {function(string, boolean=, number=)} */ var intArrayFromString = (stringy, dontAddNull, length) => {
  var len = length > 0 ? length : lengthBytesUTF8(stringy) + 1;
  var u8array = new Array(len);
  var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
  if (dontAddNull) u8array.length = numBytesWritten;
  return u8array;
};

var FS_stdin_getChar = () => {
  if (!FS_stdin_getChar_buffer.length) {
    var result = null;
    if (globalThis.window?.prompt) {
      // Browser.
      result = window.prompt("Input: ");
      // returns null on cancel
      if (result !== null) {
        result += "\n";
      }
    } else {}
    if (!result) {
      return null;
    }
    FS_stdin_getChar_buffer = intArrayFromString(result, true);
  }
  return FS_stdin_getChar_buffer.shift();
};

var __wasmfs_stdin_get_char = () => {
  // Return the read character, or -1 to indicate EOF.
  var c = FS_stdin_getChar();
  if (typeof c === "number") {
    return c;
  }
  return -1;
};

var __wasmfs_thread_utils_heartbeat = function(queue) {
  queue >>>= 0;
  var intervalID = setInterval(() => {
    if (ABORT) {
      clearInterval(intervalID);
    } else {
      _emscripten_proxy_execute_queue(queue);
    }
  }, 50);
};

var _emscripten_get_now_res = () => 1e3;

var nowIsMonotonic = 1;

var checkWasiClock = clock_id => clock_id >= 0 && clock_id <= 3;

function _clock_res_get(clk_id, pres) {
  pres >>>= 0;
  if (!checkWasiClock(clk_id)) {
    return 28;
  }
  var nsec;
  // all wasi clocks but realtime are monotonic
  if (clk_id === 0) {
    nsec = 1e3 * 1e3;
  } else if (nowIsMonotonic) {
    nsec = _emscripten_get_now_res();
  } else {
    return 52;
  }
  (growMemViews(), HEAP64)[((pres) >>> 3) >>> 0] = BigInt(nsec);
  return 0;
}

var _emscripten_date_now = () => Date.now();

function _clock_time_get(clk_id, ignored_precision, ptime) {
  ignored_precision = bigintToI53Checked(ignored_precision);
  ptime >>>= 0;
  if (!checkWasiClock(clk_id)) {
    return 28;
  }
  var now;
  // all wasi clocks but realtime are monotonic
  if (clk_id === 0) {
    now = _emscripten_date_now();
  } else if (nowIsMonotonic) {
    now = _emscripten_get_now();
  } else {
    return 52;
  }
  // "now" is in ms, and wasi times are in ns.
  var nsec = Math.round(now * 1e3 * 1e3);
  (growMemViews(), HEAP64)[((ptime) >>> 3) >>> 0] = BigInt(nsec);
  return 0;
}

var readEmAsmArgsArray = [];

var readEmAsmArgs = (sigPtr, buf) => {
  // Nobody should have mutated _readEmAsmArgsArray underneath us to be something else than an array.
  assert(Array.isArray(readEmAsmArgsArray));
  // The input buffer is allocated on the stack, so it must be stack-aligned.
  assert(buf % 16 == 0);
  readEmAsmArgsArray.length = 0;
  var ch;
  // Most arguments are i32s, so shift the buffer pointer so it is a plain
  // index into HEAP32.
  while (ch = (growMemViews(), HEAPU8)[sigPtr++ >>> 0]) {
    var chr = String.fromCharCode(ch);
    var validChars = [ "d", "f", "i", "p" ];
    // In WASM_BIGINT mode we support passing i64 values as bigint.
    validChars.push("j");
    assert(validChars.includes(chr), `Invalid character ${ch}("${chr}") in readEmAsmArgs! Use only [${validChars}], and do not specify "v" for void return argument.`);
    // Floats are always passed as doubles, so all types except for 'i'
    // are 8 bytes and require alignment.
    var wide = (ch != 105);
    wide &= (ch != 112);
    buf += wide && (buf % 8) ? 4 : 0;
    readEmAsmArgsArray.push(// Special case for pointers under wasm64 or CAN_ADDRESS_2GB mode.
    ch == 112 ? (growMemViews(), HEAPU32)[((buf) >>> 2) >>> 0] : ch == 106 ? (growMemViews(), 
    HEAP64)[((buf) >>> 3) >>> 0] : ch == 105 ? (growMemViews(), HEAP32)[((buf) >>> 2) >>> 0] : (growMemViews(), 
    HEAPF64)[((buf) >>> 3) >>> 0]);
    buf += wide ? 8 : 4;
  }
  return readEmAsmArgsArray;
};

var runMainThreadEmAsm = (emAsmAddr, sigPtr, argbuf, sync) => {
  var args = readEmAsmArgs(sigPtr, argbuf);
  if (ENVIRONMENT_IS_PTHREAD) {
    // EM_ASM functions are variadic, receiving the actual arguments as a buffer
    // in memory. the last parameter (argBuf) points to that data. We need to
    // always un-variadify that, *before proxying*, as in the async case this
    // is a stack allocation that LLVM made, which may go away before the main
    // thread gets the message. For that reason we handle proxying *after* the
    // call to readEmAsmArgs, and therefore we do that manually here instead
    // of using __proxy. (And for simplicity, do the same in the sync
    // case as well, even though it's not strictly necessary, to keep the two
    // code paths as similar as possible on both sides.)
    return proxyToMainThread(0, emAsmAddr, sync, ...args);
  }
  assert(ASM_CONSTS.hasOwnProperty(emAsmAddr), `No EM_ASM constant found at address ${emAsmAddr}.  The loaded WebAssembly file is likely out of sync with the generated JavaScript.`);
  return ASM_CONSTS[emAsmAddr](...args);
};

function _emscripten_asm_const_async_on_main_thread(emAsmAddr, sigPtr, argbuf) {
  emAsmAddr >>>= 0;
  sigPtr >>>= 0;
  argbuf >>>= 0;
  return runMainThreadEmAsm(emAsmAddr, sigPtr, argbuf, 0);
}

var runEmAsmFunction = (code, sigPtr, argbuf) => {
  var args = readEmAsmArgs(sigPtr, argbuf);
  assert(ASM_CONSTS.hasOwnProperty(code), `No EM_ASM constant found at address ${code}.  The loaded WebAssembly file is likely out of sync with the generated JavaScript.`);
  return ASM_CONSTS[code](...args);
};

function _emscripten_asm_const_int(code, sigPtr, argbuf) {
  code >>>= 0;
  sigPtr >>>= 0;
  argbuf >>>= 0;
  return runEmAsmFunction(code, sigPtr, argbuf);
}

function _emscripten_asm_const_int_sync_on_main_thread(emAsmAddr, sigPtr, argbuf) {
  emAsmAddr >>>= 0;
  sigPtr >>>= 0;
  argbuf >>>= 0;
  return runMainThreadEmAsm(emAsmAddr, sigPtr, argbuf, 1);
}

var _emscripten_check_blocking_allowed = () => {
  if (ENVIRONMENT_IS_WORKER) return;
  // Blocking in a worker/pthread is fine.
  warnOnce("Blocking on the main thread is very dangerous, see https://emscripten.org/docs/porting/pthreads.html#blocking-on-the-main-browser-thread");
};

function _emscripten_err(str) {
  str >>>= 0;
  return err(UTF8ToString(str));
}

var runtimeKeepalivePush = () => {
  runtimeKeepaliveCounter += 1;
};

var _emscripten_exit_with_live_runtime = () => {
  runtimeKeepalivePush();
  throw "unwind";
};

var maybeCStringToJsString = cString => cString > 2 ? UTF8ToString(cString) : cString;

/** @type {Object} */ var specialHTMLTargets = [ 0, globalThis.document ?? 0, globalThis.window ?? 0 ];

var findEventTarget = target => {
  target = maybeCStringToJsString(target);
  var domElement = specialHTMLTargets[target] || globalThis.document?.querySelector(target);
  return domElement;
};

var getBoundingClientRect = e => specialHTMLTargets.indexOf(e) < 0 ? e.getBoundingClientRect() : {
  "left": 0,
  "top": 0
};

function _emscripten_get_element_css_size(target, width, height) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(4, 0, 1, target, width, height);
  target >>>= 0;
  width >>>= 0;
  height >>>= 0;
  target = findEventTarget(target);
  if (!target) return -4;
  var rect = getBoundingClientRect(target);
  (growMemViews(), HEAPF64)[((width) >>> 3) >>> 0] = rect.width;
  (growMemViews(), HEAPF64)[((height) >>> 3) >>> 0] = rect.height;
  return 0;
}

var getHeapMax = () => // Stay one Wasm page short of 4GB: while e.g. Chrome is able to allocate
// full 4GB Wasm memories, the size will wrap back to 0 bytes in Wasm side
// for any code that deals with heap sizes, which would require special
// casing all heap size related code to treat 0 specially.
4294901760;

function _emscripten_get_heap_max() {
  return getHeapMax();
}

var _emscripten_has_asyncify = () => 0;

var _emscripten_num_logical_cores = () => navigator["hardwareConcurrency"];

function _emscripten_out(str) {
  str >>>= 0;
  return out(UTF8ToString(str));
}

var alignMemory = (size, alignment) => {
  assert(alignment, "alignment argument is required");
  return Math.ceil(size / alignment) * alignment;
};

var growMemory = size => {
  var oldHeapSize = wasmMemory.buffer.byteLength;
  var pages = ((size - oldHeapSize + 65535) / 65536) | 0;
  try {
    // round size grow request up to wasm page size (fixed 64KB per spec)
    wasmMemory.grow(pages);
    // .grow() takes a delta compared to the previous size
    updateMemoryViews();
    return 1;
  } catch (e) {
    err(`growMemory: Attempted to grow heap from ${oldHeapSize} bytes to ${size} bytes, but got error: ${e}`);
  }
};

function _emscripten_resize_heap(requestedSize) {
  requestedSize >>>= 0;
  var oldSize = (growMemViews(), HEAPU8).length;
  // With multithreaded builds, races can happen (another thread might increase the size
  // in between), so return a failure, and let the caller retry.
  if (requestedSize <= oldSize) {
    return false;
  }
  // Memory resize rules:
  // 1.  Always increase heap size to at least the requested size, rounded up
  //     to next page multiple.
  // 2a. If MEMORY_GROWTH_LINEAR_STEP == -1, excessively resize the heap
  //     geometrically: increase the heap size according to
  //     MEMORY_GROWTH_GEOMETRIC_STEP factor (default +20%), At most
  //     overreserve by MEMORY_GROWTH_GEOMETRIC_CAP bytes (default 96MB).
  // 2b. If MEMORY_GROWTH_LINEAR_STEP != -1, excessively resize the heap
  //     linearly: increase the heap size by at least
  //     MEMORY_GROWTH_LINEAR_STEP bytes.
  // 3.  Max size for the heap is capped at 2048MB-WASM_PAGE_SIZE, or by
  //     MAXIMUM_MEMORY, or by ASAN limit, depending on which is smallest
  // 4.  If we were unable to allocate as much memory, it may be due to
  //     over-eager decision to excessively reserve due to (3) above.
  //     Hence if an allocation fails, cut down on the amount of excess
  //     growth, in an attempt to succeed to perform a smaller allocation.
  // A limit is set for how much we can grow. We should not exceed that
  // (the wasm binary specifies it, so if we tried, we'd fail anyhow).
  var maxHeapSize = getHeapMax();
  if (requestedSize > maxHeapSize) {
    err(`Cannot enlarge memory, requested ${requestedSize} bytes, but the limit is ${maxHeapSize} bytes!`);
    return false;
  }
  // Loop through potential heap size increases. If we attempt a too eager
  // reservation that fails, cut down on the attempted size and reserve a
  // smaller bump instead. (max 3 times, chosen somewhat arbitrarily)
  for (var cutDown = 1; cutDown <= 4; cutDown *= 2) {
    var overGrownHeapSize = oldSize * (1 + .2 / cutDown);
    // ensure geometric growth
    // but limit overreserving (default to capping at +96MB overgrowth at most)
    overGrownHeapSize = Math.min(overGrownHeapSize, requestedSize + 100663296);
    var newSize = Math.min(maxHeapSize, alignMemory(Math.max(requestedSize, overGrownHeapSize), 65536));
    var replacement = growMemory(newSize);
    if (replacement) {
      return true;
    }
  }
  err(`Failed to grow the heap from ${oldSize} bytes to ${newSize} bytes, not enough memory!`);
  return false;
}

var onExits = [];

var addOnExit = cb => onExits.push(cb);

var JSEvents = {
  removeAllEventListeners() {
    while (JSEvents.eventHandlers.length) {
      JSEvents._removeHandler(JSEvents.eventHandlers.length - 1);
    }
    JSEvents.deferredCalls = [];
  },
  inEventHandler: 0,
  deferredCalls: [],
  deferCall(targetFunction, precedence, argsList) {
    function arraysHaveEqualContent(arrA, arrB) {
      if (arrA.length != arrB.length) return false;
      for (var i in arrA) {
        if (arrA[i] != arrB[i]) return false;
      }
      return true;
    }
    // Test if the given call was already queued, and if so, don't add it again.
    for (var call of JSEvents.deferredCalls) {
      if (call.targetFunction == targetFunction && arraysHaveEqualContent(call.argsList, argsList)) {
        return;
      }
    }
    JSEvents.deferredCalls.push({
      targetFunction,
      precedence,
      argsList
    });
    JSEvents.deferredCalls.sort((x, y) => x.precedence - y.precedence);
  },
  removeDeferredCalls(targetFunction) {
    JSEvents.deferredCalls = JSEvents.deferredCalls.filter(call => call.targetFunction != targetFunction);
  },
  canPerformEventHandlerRequests() {
    // Browsers that support navigator.userActivation.isActive: https://developer.mozilla.org/en-US/docs/Web/API/UserActivation/isActive
    if (navigator.userActivation) {
      // Verify against transient activation status from UserActivation API
      // whether it is possible to perform a request here without needing to defer. See
      // https://developer.mozilla.org/en-US/docs/Web/Security/User_activation#transient_activation
      // and https://caniuse.com/mdn-api_useractivation
      return navigator.userActivation.isActive;
    }
    return JSEvents.inEventHandler && JSEvents.currentEventHandler.allowsDeferredCalls;
  },
  runDeferredCalls() {
    if (!JSEvents.canPerformEventHandlerRequests()) {
      return;
    }
    var deferredCalls = JSEvents.deferredCalls;
    JSEvents.deferredCalls = [];
    for (var call of deferredCalls) {
      call.targetFunction(...call.argsList);
    }
  },
  eventHandlers: [],
  removeAllHandlersOnTarget: (target, eventTypeString) => {
    for (var i = 0; i < JSEvents.eventHandlers.length; ++i) {
      if (JSEvents.eventHandlers[i].target == target && (!eventTypeString || eventTypeString == JSEvents.eventHandlers[i].eventTypeString)) {
        JSEvents._removeHandler(i--);
      }
    }
  },
  _removeHandler(i) {
    var h = JSEvents.eventHandlers[i];
    h.target.removeEventListener(h.eventTypeString, h.eventListenerFunc, h.useCapture);
    JSEvents.eventHandlers.splice(i, 1);
  },
  registerOrRemoveHandler(eventHandler) {
    if (!eventHandler.target) {
      err("registerOrRemoveHandler: the target element for event handler registration does not exist, when processing the following event handler registration:");
      console.dir(eventHandler);
      return -4;
    }
    if (eventHandler.callbackfunc) {
      eventHandler.eventListenerFunc = function(event) {
        // Increment nesting count for the event handler.
        ++JSEvents.inEventHandler;
        JSEvents.currentEventHandler = eventHandler;
        // Process any old deferred calls the user has placed.
        JSEvents.runDeferredCalls();
        // Process the actual event, calls back to user C code handler.
        eventHandler.handlerFunc(event);
        // Process any new deferred calls that were placed right now from this event handler.
        JSEvents.runDeferredCalls();
        // Out of event handler - restore nesting count.
        --JSEvents.inEventHandler;
      };
      eventHandler.target.addEventListener(eventHandler.eventTypeString, eventHandler.eventListenerFunc, eventHandler.useCapture);
      JSEvents.eventHandlers.push(eventHandler);
    } else {
      for (var i = 0; i < JSEvents.eventHandlers.length; ++i) {
        if (JSEvents.eventHandlers[i].target == eventHandler.target && JSEvents.eventHandlers[i].eventTypeString == eventHandler.eventTypeString) {
          JSEvents._removeHandler(i--);
        }
      }
    }
    return 0;
  },
  removeSingleHandler(eventHandler) {
    let success = false;
    for (let i = 0; i < JSEvents.eventHandlers.length; ++i) {
      const handler = JSEvents.eventHandlers[i];
      if (handler.target === eventHandler.target && handler.eventTypeId === eventHandler.eventTypeId && handler.callbackfunc === eventHandler.callbackfunc && handler.userData === eventHandler.userData) {
        // in some very rare cases (ex: Safari / fullscreen events), there is more than 1 handler (eventTypeString is different)
        JSEvents._removeHandler(i--);
        success = true;
      }
    }
    return success ? 0 : -5;
  },
  getTargetThreadForEventCallback(targetThread) {
    switch (targetThread) {
     case 1:
      // The event callback for the current event should be called on the
      // main browser thread. (0 == don't proxy)
      return 0;

     case 2:
      // The event callback for the current event should be backproxied to
      // the thread that is registering the event.
      // This can be 0 in the case that the caller uses
      // EM_CALLBACK_THREAD_CONTEXT_CALLING_THREAD but on the main thread
      // itself.
      return PThread.currentProxiedOperationCallerThread;

     default:
      // The event callback for the current event should be proxied to the
      // given specific thread.
      return targetThread;
    }
  },
  getNodeNameForTarget(target) {
    if (target == window) return "#window";
    if (target == screen) return "#screen";
    return target?.nodeName ?? "";
  },
  fullscreenEnabled() {
    return document.fullscreenEnabled || document.webkitFullscreenEnabled;
  }
};

var registerKeyEventCallback = (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) => {
  targetThread = JSEvents.getTargetThreadForEventCallback(targetThread);
  var eventSize = 160;
  JSEvents.keyEvent ||= _malloc(eventSize);
  var keyEventHandlerFunc = e => {
    assert(e);
    var keyEventData = JSEvents.keyEvent;
    (growMemViews(), HEAPF64)[((keyEventData) >>> 3) >>> 0] = e.timeStamp;
    var idx = ((keyEventData) >>> 2);
    (growMemViews(), HEAP32)[idx + 2 >>> 0] = e.location;
    (growMemViews(), HEAP8)[keyEventData + 12 >>> 0] = e.ctrlKey;
    (growMemViews(), HEAP8)[keyEventData + 13 >>> 0] = e.shiftKey;
    (growMemViews(), HEAP8)[keyEventData + 14 >>> 0] = e.altKey;
    (growMemViews(), HEAP8)[keyEventData + 15 >>> 0] = e.metaKey;
    (growMemViews(), HEAP8)[keyEventData + 16 >>> 0] = e.repeat;
    (growMemViews(), HEAP32)[idx + 5 >>> 0] = e.charCode;
    (growMemViews(), HEAP32)[idx + 6 >>> 0] = e.keyCode;
    (growMemViews(), HEAP32)[idx + 7 >>> 0] = e.which;
    stringToUTF8(e.key ?? "", keyEventData + 32, 32);
    stringToUTF8(e.code ?? "", keyEventData + 64, 32);
    stringToUTF8(e.char ?? "", keyEventData + 96, 32);
    stringToUTF8(e.locale ?? "", keyEventData + 128, 32);
    if (targetThread) __emscripten_run_callback_on_thread(targetThread, callbackfunc, eventTypeId, keyEventData, eventSize, userData); else if (getWasmTableEntry(callbackfunc)(eventTypeId, keyEventData, userData)) e.preventDefault();
  };
  var eventHandler = {
    target: findEventTarget(target),
    eventTypeString,
    eventTypeId,
    userData,
    callbackfunc,
    handlerFunc: keyEventHandlerFunc,
    useCapture
  };
  return JSEvents.registerOrRemoveHandler(eventHandler);
};

function _emscripten_set_keydown_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(5, 0, 1, target, userData, useCapture, callbackfunc, targetThread);
  target >>>= 0;
  userData >>>= 0;
  callbackfunc >>>= 0;
  targetThread >>>= 0;
  return registerKeyEventCallback(target, userData, useCapture, callbackfunc, 2, "keydown", targetThread);
}

function _emscripten_set_keyup_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(6, 0, 1, target, userData, useCapture, callbackfunc, targetThread);
  target >>>= 0;
  userData >>>= 0;
  callbackfunc >>>= 0;
  targetThread >>>= 0;
  return registerKeyEventCallback(target, userData, useCapture, callbackfunc, 3, "keyup", targetThread);
}

var _emscripten_set_main_loop_timing = (mode, value) => {
  MainLoop.timingMode = mode;
  MainLoop.timingValue = value;
  if (!MainLoop.func) {
    err("emscripten_set_main_loop_timing: Cannot set timing mode for main loop since a main loop does not exist! Call emscripten_set_main_loop first to set one up.");
    return 1;
  }
  if (!MainLoop.running) {
    runtimeKeepalivePush();
    MainLoop.running = true;
  }
  if (mode == 0) {
    MainLoop.scheduler = function MainLoop_scheduler_setTimeout() {
      var timeUntilNextTick = Math.max(0, MainLoop.tickStartTime + value - _emscripten_get_now()) | 0;
      setTimeout(MainLoop.runner, timeUntilNextTick);
    };
  } else if (mode == 1) {
    MainLoop.scheduler = function MainLoop_scheduler_rAF() {
      MainLoop.requestAnimationFrame(MainLoop.runner);
    };
  } else {
    assert(mode == 2);
    if (!MainLoop.setImmediate) {
      if (globalThis.scheduler) {
        // Some modern browsers implement scheduler.postTask, but not all.
        MainLoop.setImmediate = scheduler.postTask.bind(scheduler);
      } else {
        // Emulate setImmediate. (note: not a complete polyfill, we don't emulate clearImmediate() to keep code size to minimum, since not needed)
        var setImmediates = [];
        var emscriptenMainLoopMessageId = "setimmediate";
        /** @param {Event} event */ var MainLoop_setImmediate_messageHandler = event => {
          if (event.data === emscriptenMainLoopMessageId) {
            event.stopPropagation();
            setImmediates.shift()();
          }
        };
        addEventListener("message", MainLoop_setImmediate_messageHandler, true);
        MainLoop.setImmediate = /** @type{function(function(): ?, ...?): number} */ (func => {
          setImmediates.push(func);
          if (ENVIRONMENT_IS_WORKER) {
            // The postMessge API in a Worker, sends message to the main
            // thread and does not support the `targetOrigin` (*) argument.
            postMessage(emscriptenMainLoopMessageId);
          } else {
            postMessage(emscriptenMainLoopMessageId, "*");
          }
        });
      }
    }
    MainLoop.scheduler = function MainLoop_scheduler_setImmediate() {
      MainLoop.setImmediate(MainLoop.runner);
    };
  }
  return 0;
};

var MainLoop = {
  running: false,
  scheduler: null,
  currentlyRunningMainloop: 0,
  func: null,
  arg: 0,
  timingMode: 0,
  timingValue: 0,
  currentFrameNumber: 0,
  queue: [],
  preMainLoop: [],
  postMainLoop: [],
  pause() {
    MainLoop.scheduler = null;
    // Incrementing this signals the previous main loop that it's now become old, and it must return.
    MainLoop.currentlyRunningMainloop++;
  },
  resume() {
    MainLoop.currentlyRunningMainloop++;
    var timingMode = MainLoop.timingMode;
    var timingValue = MainLoop.timingValue;
    var func = MainLoop.func;
    MainLoop.func = null;
    // do not set timing and call scheduler, we will do it on the next lines
    setMainLoop(func, 0, false, MainLoop.arg, true);
    _emscripten_set_main_loop_timing(timingMode, timingValue);
    MainLoop.scheduler();
  },
  updateStatus() {
    if (Module["setStatus"]) {
      var message = Module["statusMessage"] || "Please wait...";
      var remaining = MainLoop.remainingBlockers ?? 0;
      var expected = MainLoop.expectedBlockers ?? 0;
      if (remaining) {
        if (remaining < expected) {
          Module["setStatus"](`{message} ({expected - remaining}/{expected})`);
        } else {
          Module["setStatus"](message);
        }
      } else {
        Module["setStatus"]("");
      }
    }
  },
  init() {
    Module["preMainLoop"] && MainLoop.preMainLoop.push(Module["preMainLoop"]);
    Module["postMainLoop"] && MainLoop.postMainLoop.push(Module["postMainLoop"]);
  },
  runIter(func) {
    if (ABORT) return;
    for (var pre of MainLoop.preMainLoop) {
      if (pre() === false) {
        return;
      }
    }
    callUserCallback(func);
    for (var post of MainLoop.postMainLoop) {
      post();
    }
    checkStackCookie();
  },
  nextRAF: 0,
  fakeRequestAnimationFrame(func) {
    // try to keep 60fps between calls to here
    var now = Date.now();
    if (MainLoop.nextRAF === 0) {
      MainLoop.nextRAF = now + 1e3 / 60;
    } else {
      while (now + 2 >= MainLoop.nextRAF) {
        // fudge a little, to avoid timer jitter causing us to do lots of delay:0
        MainLoop.nextRAF += 1e3 / 60;
      }
    }
    var delay = Math.max(MainLoop.nextRAF - now, 0);
    setTimeout(func, delay);
  },
  requestAnimationFrame(func) {
    if (globalThis.requestAnimationFrame) {
      requestAnimationFrame(func);
    } else {
      MainLoop.fakeRequestAnimationFrame(func);
    }
  }
};

var runtimeKeepalivePop = () => {
  assert(runtimeKeepaliveCounter > 0);
  runtimeKeepaliveCounter -= 1;
};

/**
   * @param {number=} arg
   * @param {boolean=} noSetTiming
   */ var setMainLoop = (iterFunc, fps, simulateInfiniteLoop, arg, noSetTiming) => {
  assert(!MainLoop.func, "emscripten_set_main_loop: there can only be one main loop function at once");
  MainLoop.func = iterFunc;
  MainLoop.arg = arg;
  var thisMainLoopId = MainLoop.currentlyRunningMainloop;
  function checkIsRunning() {
    if (thisMainLoopId < MainLoop.currentlyRunningMainloop) {
      runtimeKeepalivePop();
      maybeExit();
      return false;
    }
    return true;
  }
  // We create the loop runner here but it is not actually running until
  // _emscripten_set_main_loop_timing is called (which might happen at a
  // later time).  This member signifies that the current runner has not
  // yet been started so that we can call runtimeKeepalivePush when it
  // gets its timing set for the first time.
  MainLoop.running = false;
  MainLoop.runner = function MainLoop_runner() {
    if (ABORT) return;
    if (MainLoop.queue.length > 0) {
      var start = Date.now();
      var blocker = MainLoop.queue.shift();
      blocker.func(blocker.arg);
      if (MainLoop.remainingBlockers) {
        var remaining = MainLoop.remainingBlockers;
        var next = remaining % 1 == 0 ? remaining - 1 : Math.floor(remaining);
        if (blocker.counted) {
          MainLoop.remainingBlockers = next;
        } else {
          // not counted, but move the progress along a tiny bit
          next = next + .5;
          // do not steal all the next one's progress
          MainLoop.remainingBlockers = (8 * remaining + next) / 9;
        }
      }
      MainLoop.updateStatus();
      // catches pause/resume main loop from blocker execution
      if (!checkIsRunning()) return;
      setTimeout(MainLoop.runner, 0);
      return;
    }
    // catch pauses from non-main loop sources
    if (!checkIsRunning()) return;
    // Implement very basic swap interval control
    MainLoop.currentFrameNumber = MainLoop.currentFrameNumber + 1 | 0;
    if (MainLoop.timingMode == 1 && MainLoop.timingValue > 1 && MainLoop.currentFrameNumber % MainLoop.timingValue != 0) {
      // Not the scheduled time to render this frame - skip.
      MainLoop.scheduler();
      return;
    } else if (MainLoop.timingMode == 0) {
      MainLoop.tickStartTime = _emscripten_get_now();
      if (Module["ctx"]) {
        warnOnce("Looks like you are rendering without using requestAnimationFrame for the main loop. You should use 0 for the frame rate in emscripten_set_main_loop in order to use requestAnimationFrame, as that can greatly improve your frame rates!");
      }
    }
    MainLoop.runIter(iterFunc);
    // catch pauses from the main loop itself
    if (!checkIsRunning()) return;
    MainLoop.scheduler();
  };
  if (!noSetTiming) {
    if (fps > 0) {
      _emscripten_set_main_loop_timing(0, 1e3 / fps);
    } else {
      // Do rAF by rendering each frame (no decimating)
      _emscripten_set_main_loop_timing(1, 1);
    }
    MainLoop.scheduler();
  }
  if (simulateInfiniteLoop) {
    throw "unwind";
  }
};

var _emscripten_set_main_loop_arg = function(func, arg, fps, simulateInfiniteLoop) {
  func >>>= 0;
  arg >>>= 0;
  var iterFunc = () => getWasmTableEntry(func)(arg);
  setMainLoop(iterFunc, fps, simulateInfiniteLoop, arg);
};

var fillMouseEventData = (eventStruct, e, target) => {
  assert(eventStruct % 4 == 0);
  (growMemViews(), HEAPF64)[((eventStruct) >>> 3) >>> 0] = e.timeStamp;
  var idx = ((eventStruct) >>> 2);
  (growMemViews(), HEAP32)[idx + 2 >>> 0] = e.screenX;
  (growMemViews(), HEAP32)[idx + 3 >>> 0] = e.screenY;
  (growMemViews(), HEAP32)[idx + 4 >>> 0] = e.clientX;
  (growMemViews(), HEAP32)[idx + 5 >>> 0] = e.clientY;
  (growMemViews(), HEAP8)[eventStruct + 24 >>> 0] = e.ctrlKey;
  (growMemViews(), HEAP8)[eventStruct + 25 >>> 0] = e.shiftKey;
  (growMemViews(), HEAP8)[eventStruct + 26 >>> 0] = e.altKey;
  (growMemViews(), HEAP8)[eventStruct + 27 >>> 0] = e.metaKey;
  (growMemViews(), HEAP16)[idx * 2 + 14 >>> 0] = e.button;
  (growMemViews(), HEAP16)[idx * 2 + 15 >>> 0] = e.buttons;
  (growMemViews(), HEAP32)[idx + 8 >>> 0] = e["movementX"];
  (growMemViews(), HEAP32)[idx + 9 >>> 0] = e["movementY"];
  // Note: rect contains doubles (truncated to placate SAFE_HEAP, which is the same behaviour when writing to HEAP32 anyway)
  var rect = getBoundingClientRect(target);
  (growMemViews(), HEAP32)[idx + 10 >>> 0] = e.clientX - (rect.left | 0);
  (growMemViews(), HEAP32)[idx + 11 >>> 0] = e.clientY - (rect.top | 0);
};

var registerMouseEventCallback = (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) => {
  targetThread = JSEvents.getTargetThreadForEventCallback(targetThread);
  var eventSize = 64;
  JSEvents.mouseEvent ||= _malloc(eventSize);
  target = findEventTarget(target);
  var mouseEventHandlerFunc = e => {
    // TODO: Make this access thread safe, or this could update live while app is reading it.
    fillMouseEventData(JSEvents.mouseEvent, e, target);
    if (targetThread) {
      __emscripten_run_callback_on_thread(targetThread, callbackfunc, eventTypeId, JSEvents.mouseEvent, eventSize, userData);
    } else if (getWasmTableEntry(callbackfunc)(eventTypeId, JSEvents.mouseEvent, userData)) e.preventDefault();
  };
  var eventHandler = {
    target,
    allowsDeferredCalls: eventTypeString != "mousemove" && eventTypeString != "mouseenter" && eventTypeString != "mouseleave",
    // Mouse move events do not allow fullscreen/pointer lock requests to be handled in them!
    eventTypeString,
    eventTypeId,
    userData,
    callbackfunc,
    handlerFunc: mouseEventHandlerFunc,
    useCapture
  };
  return JSEvents.registerOrRemoveHandler(eventHandler);
};

function _emscripten_set_mousedown_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(7, 0, 1, target, userData, useCapture, callbackfunc, targetThread);
  target >>>= 0;
  userData >>>= 0;
  callbackfunc >>>= 0;
  targetThread >>>= 0;
  return registerMouseEventCallback(target, userData, useCapture, callbackfunc, 5, "mousedown", targetThread);
}

function _emscripten_set_mousemove_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(8, 0, 1, target, userData, useCapture, callbackfunc, targetThread);
  target >>>= 0;
  userData >>>= 0;
  callbackfunc >>>= 0;
  targetThread >>>= 0;
  return registerMouseEventCallback(target, userData, useCapture, callbackfunc, 8, "mousemove", targetThread);
}

function _emscripten_set_mouseup_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(9, 0, 1, target, userData, useCapture, callbackfunc, targetThread);
  target >>>= 0;
  userData >>>= 0;
  callbackfunc >>>= 0;
  targetThread >>>= 0;
  return registerMouseEventCallback(target, userData, useCapture, callbackfunc, 6, "mouseup", targetThread);
}

var registerUiEventCallback = (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) => {
  targetThread = JSEvents.getTargetThreadForEventCallback(targetThread);
  var eventSize = 36;
  JSEvents.uiEvent ||= _malloc(eventSize);
  target = findEventTarget(target);
  var uiEventHandlerFunc = e => {
    if (e.target != target) {
      // Never take ui events such as scroll via a 'bubbled' route, but always from the direct element that
      // was targeted. Otherwise e.g. if app logs a message in response to a page scroll, the Emscripten log
      // message box could cause to scroll, generating a new (bubbled) scroll message, causing a new log print,
      // causing a new scroll, etc..
      return;
    }
    var b = document.body;
    // Take document.body to a variable, Closure compiler does not outline access to it on its own.
    if (!b) {
      // During a page unload 'body' can be null, with "Cannot read property 'clientWidth' of null" being thrown
      return;
    }
    var uiEvent = JSEvents.uiEvent;
    (growMemViews(), HEAP32)[((uiEvent) >>> 2) >>> 0] = 0;
    // always zero for resize and scroll
    (growMemViews(), HEAP32)[(((uiEvent) + (4)) >>> 2) >>> 0] = b.clientWidth;
    (growMemViews(), HEAP32)[(((uiEvent) + (8)) >>> 2) >>> 0] = b.clientHeight;
    (growMemViews(), HEAP32)[(((uiEvent) + (12)) >>> 2) >>> 0] = innerWidth;
    (growMemViews(), HEAP32)[(((uiEvent) + (16)) >>> 2) >>> 0] = innerHeight;
    (growMemViews(), HEAP32)[(((uiEvent) + (20)) >>> 2) >>> 0] = outerWidth;
    (growMemViews(), HEAP32)[(((uiEvent) + (24)) >>> 2) >>> 0] = outerHeight;
    (growMemViews(), HEAP32)[(((uiEvent) + (28)) >>> 2) >>> 0] = pageXOffset | 0;
    // scroll offsets are float
    (growMemViews(), HEAP32)[(((uiEvent) + (32)) >>> 2) >>> 0] = pageYOffset | 0;
    if (targetThread) __emscripten_run_callback_on_thread(targetThread, callbackfunc, eventTypeId, uiEvent, eventSize, userData); else if (getWasmTableEntry(callbackfunc)(eventTypeId, uiEvent, userData)) e.preventDefault();
  };
  var eventHandler = {
    target,
    eventTypeString,
    eventTypeId,
    userData,
    callbackfunc,
    handlerFunc: uiEventHandlerFunc,
    useCapture
  };
  return JSEvents.registerOrRemoveHandler(eventHandler);
};

function _emscripten_set_resize_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(10, 0, 1, target, userData, useCapture, callbackfunc, targetThread);
  target >>>= 0;
  userData >>>= 0;
  callbackfunc >>>= 0;
  targetThread >>>= 0;
  return registerUiEventCallback(target, userData, useCapture, callbackfunc, 10, "resize", targetThread);
}

var registerWheelEventCallback = (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) => {
  targetThread = JSEvents.getTargetThreadForEventCallback(targetThread);
  var eventSize = 96;
  JSEvents.wheelEvent ||= _malloc(eventSize);
  // The DOM Level 3 events spec event 'wheel'
  var wheelHandlerFunc = e => {
    var wheelEvent = JSEvents.wheelEvent;
    fillMouseEventData(wheelEvent, e, target);
    (growMemViews(), HEAPF64)[(((wheelEvent) + (64)) >>> 3) >>> 0] = e["deltaX"];
    (growMemViews(), HEAPF64)[(((wheelEvent) + (72)) >>> 3) >>> 0] = e["deltaY"];
    (growMemViews(), HEAPF64)[(((wheelEvent) + (80)) >>> 3) >>> 0] = e["deltaZ"];
    (growMemViews(), HEAP32)[(((wheelEvent) + (88)) >>> 2) >>> 0] = e["deltaMode"];
    if (targetThread) __emscripten_run_callback_on_thread(targetThread, callbackfunc, eventTypeId, wheelEvent, eventSize, userData); else if (getWasmTableEntry(callbackfunc)(eventTypeId, wheelEvent, userData)) e.preventDefault();
  };
  var eventHandler = {
    target,
    allowsDeferredCalls: true,
    eventTypeString,
    eventTypeId,
    userData,
    callbackfunc,
    handlerFunc: wheelHandlerFunc,
    useCapture
  };
  return JSEvents.registerOrRemoveHandler(eventHandler);
};

function _emscripten_set_wheel_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(11, 0, 1, target, userData, useCapture, callbackfunc, targetThread);
  target >>>= 0;
  userData >>>= 0;
  callbackfunc >>>= 0;
  targetThread >>>= 0;
  target = findEventTarget(target);
  if (!target) return -4;
  if (typeof target.onwheel != "undefined") {
    return registerWheelEventCallback(target, userData, useCapture, callbackfunc, 9, "wheel", targetThread);
  } else {
    return -1;
  }
}

var _emscripten_unwind_to_js_event_loop = () => {
  throw "unwind";
};

function _emscripten_webgpu_get_device(...args) {
  abort("missing function: emscripten_webgpu_get_device");
}

_emscripten_webgpu_get_device.stub = true;

var ENV = {};

var getExecutableName = () => thisProgram;

var getEnvStrings = () => {
  if (!getEnvStrings.strings) {
    // Default values.
    var lang = (globalThis.navigator?.language ?? "C").replace("-", "_") + ".UTF-8";
    var env = {
      "USER": "web_user",
      "LOGNAME": "web_user",
      "PATH": "/",
      "PWD": "/",
      "HOME": "/home/web_user",
      "LANG": lang,
      "_": getExecutableName()
    };
    // Apply the user-provided values, if any.
    for (var x in ENV) {
      // x is a key in ENV; if ENV[x] is undefined, that means it was
      // explicitly set to be so. We allow user code to do that to
      // force variables with default values to remain unset.
      if (ENV[x] === undefined) delete env[x]; else env[x] = ENV[x];
    }
    var strings = [];
    for (var x in env) {
      strings.push(`${x}=${env[x]}`);
    }
    getEnvStrings.strings = strings;
  }
  return getEnvStrings.strings;
};

function _environ_get(__environ, environ_buf) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(12, 0, 1, __environ, environ_buf);
  __environ >>>= 0;
  environ_buf >>>= 0;
  var bufSize = 0;
  var envp = 0;
  for (var string of getEnvStrings()) {
    var ptr = environ_buf + bufSize;
    (growMemViews(), HEAPU32)[(((__environ) + (envp)) >>> 2) >>> 0] = ptr;
    bufSize += stringToUTF8(string, ptr, Infinity) + 1;
    envp += 4;
  }
  return 0;
}

function _environ_sizes_get(penviron_count, penviron_buf_size) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(13, 0, 1, penviron_count, penviron_buf_size);
  penviron_count >>>= 0;
  penviron_buf_size >>>= 0;
  var strings = getEnvStrings();
  (growMemViews(), HEAPU32)[((penviron_count) >>> 2) >>> 0] = strings.length;
  var bufSize = 0;
  for (var string of strings) {
    bufSize += lengthBytesUTF8(string) + 1;
  }
  (growMemViews(), HEAPU32)[((penviron_buf_size) >>> 2) >>> 0] = bufSize;
  return 0;
}

var inetNtop4 = addr => (addr & 255) + "." + ((addr >> 8) & 255) + "." + ((addr >> 16) & 255) + "." + ((addr >> 24) & 255);

var inetNtop6 = ints => {
  //  ref:  http://www.ietf.org/rfc/rfc2373.txt - section 2.5.4
  //  Format for IPv4 compatible and mapped  128-bit IPv6 Addresses
  //  128-bits are split into eight 16-bit words
  //  stored in network byte order (big-endian)
  //  |                80 bits               | 16 |      32 bits        |
  //  +-----------------------------------------------------------------+
  //  |               10 bytes               |  2 |      4 bytes        |
  //  +--------------------------------------+--------------------------+
  //  +               5 words                |  1 |      2 words        |
  //  +--------------------------------------+--------------------------+
  //  |0000..............................0000|0000|    IPv4 ADDRESS     | (compatible)
  //  +--------------------------------------+----+---------------------+
  //  |0000..............................0000|FFFF|    IPv4 ADDRESS     | (mapped)
  //  +--------------------------------------+----+---------------------+
  var str = "";
  var word = 0;
  var longest = 0;
  var lastzero = 0;
  var zstart = 0;
  var len = 0;
  var i = 0;
  var parts = [ ints[0] & 65535, (ints[0] >> 16), ints[1] & 65535, (ints[1] >> 16), ints[2] & 65535, (ints[2] >> 16), ints[3] & 65535, (ints[3] >> 16) ];
  // Handle IPv4-compatible, IPv4-mapped, loopback and any/unspecified addresses
  var hasipv4 = true;
  var v4part = "";
  // check if the 10 high-order bytes are all zeros (first 5 words)
  for (i = 0; i < 5; i++) {
    if (parts[i] !== 0) {
      hasipv4 = false;
      break;
    }
  }
  if (hasipv4) {
    // low-order 32-bits store an IPv4 address (bytes 13 to 16) (last 2 words)
    v4part = inetNtop4(parts[6] | (parts[7] << 16));
    // IPv4-mapped IPv6 address if 16-bit value (bytes 11 and 12) == 0xFFFF (6th word)
    if (parts[5] === -1) {
      str = "::ffff:";
      str += v4part;
      return str;
    }
    // IPv4-compatible IPv6 address if 16-bit value (bytes 11 and 12) == 0x0000 (6th word)
    if (parts[5] === 0) {
      str = "::";
      // special case IPv6 addresses
      if (v4part === "0.0.0.0") v4part = "";
      // any/unspecified address
      if (v4part === "0.0.0.1") v4part = "1";
      // loopback address
      str += v4part;
      return str;
    }
  }
  // Handle all other IPv6 addresses
  // first run to find the longest contiguous zero words
  for (word = 0; word < 8; word++) {
    if (parts[word] === 0) {
      if (word - lastzero > 1) {
        len = 0;
      }
      lastzero = word;
      len++;
    }
    if (len > longest) {
      longest = len;
      zstart = word - longest + 1;
    }
  }
  for (word = 0; word < 8; word++) {
    if (longest > 1) {
      // compress contiguous zeros - to produce "::"
      if (parts[word] === 0 && word >= zstart && word < (zstart + longest)) {
        if (word === zstart) {
          str += ":";
          if (zstart === 0) str += ":";
        }
        continue;
      }
    }
    // converts 16-bit words from big-endian to little-endian before converting to hex string
    str += Number(_ntohs(parts[word] & 65535)).toString(16);
    str += word < 7 ? ":" : "";
  }
  return str;
};

var zeroMemory = (ptr, size) => (growMemViews(), HEAPU8).fill(0, ptr, ptr + size);

/** @param {number=} addrlen */ var writeSockaddr = (sa, family, addr, port, addrlen) => {
  switch (family) {
   case 2:
    addr = inetPton4(addr);
    zeroMemory(sa, 16);
    if (addrlen) {
      (growMemViews(), HEAP32)[((addrlen) >>> 2) >>> 0] = 16;
    }
    (growMemViews(), HEAP16)[((sa) >>> 1) >>> 0] = family;
    (growMemViews(), HEAP32)[(((sa) + (4)) >>> 2) >>> 0] = addr;
    (growMemViews(), HEAP16)[(((sa) + (2)) >>> 1) >>> 0] = _htons(port);
    break;

   case 10:
    addr = inetPton6(addr);
    zeroMemory(sa, 28);
    if (addrlen) {
      (growMemViews(), HEAP32)[((addrlen) >>> 2) >>> 0] = 28;
    }
    (growMemViews(), HEAP32)[((sa) >>> 2) >>> 0] = family;
    (growMemViews(), HEAP32)[(((sa) + (8)) >>> 2) >>> 0] = addr[0];
    (growMemViews(), HEAP32)[(((sa) + (12)) >>> 2) >>> 0] = addr[1];
    (growMemViews(), HEAP32)[(((sa) + (16)) >>> 2) >>> 0] = addr[2];
    (growMemViews(), HEAP32)[(((sa) + (20)) >>> 2) >>> 0] = addr[3];
    (growMemViews(), HEAP16)[(((sa) + (2)) >>> 1) >>> 0] = _htons(port);
    break;

   default:
    return 5;
  }
  return 0;
};

function _getaddrinfo(node, service, hint, out) {
  if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(14, 0, 1, node, service, hint, out);
  node >>>= 0;
  service >>>= 0;
  hint >>>= 0;
  out >>>= 0;
  // Note getaddrinfo currently only returns a single addrinfo with ai_next defaulting to NULL. When NULL
  // hints are specified or ai_family set to AF_UNSPEC or ai_socktype or ai_protocol set to 0 then we
  // really should provide a linked list of suitable addrinfo values.
  var addrs = [];
  var canon = null;
  var addr = 0;
  var port = 0;
  var flags = 0;
  var family = 0;
  var type = 0;
  var proto = 0;
  var ai, last;
  function allocaddrinfo(family, type, proto, canon, addr, port) {
    var sa, salen, ai;
    var errno;
    salen = family === 10 ? 28 : 16;
    addr = family === 10 ? inetNtop6(addr) : inetNtop4(addr);
    sa = _malloc(salen);
    errno = writeSockaddr(sa, family, addr, port);
    assert(!errno);
    ai = _malloc(32);
    (growMemViews(), HEAP32)[(((ai) + (4)) >>> 2) >>> 0] = family;
    (growMemViews(), HEAP32)[(((ai) + (8)) >>> 2) >>> 0] = type;
    (growMemViews(), HEAP32)[(((ai) + (12)) >>> 2) >>> 0] = proto;
    (growMemViews(), HEAPU32)[(((ai) + (24)) >>> 2) >>> 0] = canon;
    (growMemViews(), HEAPU32)[(((ai) + (20)) >>> 2) >>> 0] = sa;
    if (family === 10) {
      (growMemViews(), HEAP32)[(((ai) + (16)) >>> 2) >>> 0] = 28;
    } else {
      (growMemViews(), HEAP32)[(((ai) + (16)) >>> 2) >>> 0] = 16;
    }
    (growMemViews(), HEAP32)[(((ai) + (28)) >>> 2) >>> 0] = 0;
    return ai;
  }
  if (hint) {
    flags = (growMemViews(), HEAP32)[((hint) >>> 2) >>> 0];
    family = (growMemViews(), HEAP32)[(((hint) + (4)) >>> 2) >>> 0];
    type = (growMemViews(), HEAP32)[(((hint) + (8)) >>> 2) >>> 0];
    proto = (growMemViews(), HEAP32)[(((hint) + (12)) >>> 2) >>> 0];
  }
  if (type && !proto) {
    proto = type === 2 ? 17 : 6;
  }
  if (!type && proto) {
    type = proto === 17 ? 2 : 1;
  }
  // If type or proto are set to zero in hints we should really be returning multiple addrinfo values, but for
  // now default to a TCP STREAM socket so we can at least return a sensible addrinfo given NULL hints.
  if (proto === 0) {
    proto = 6;
  }
  if (type === 0) {
    type = 1;
  }
  if (!node && !service) {
    return -2;
  }
  if (flags & ~(1 | 2 | 4 | 1024 | 8 | 16 | 32)) {
    return -1;
  }
  if (hint !== 0 && ((growMemViews(), HEAP32)[((hint) >>> 2) >>> 0] & 2) && !node) {
    return -1;
  }
  if (flags & 32) {
    // TODO
    return -2;
  }
  if (type !== 0 && type !== 1 && type !== 2) {
    return -7;
  }
  if (family !== 0 && family !== 2 && family !== 10) {
    return -6;
  }
  if (service) {
    service = UTF8ToString(service);
    port = parseInt(service, 10);
    if (isNaN(port)) {
      if (flags & 1024) {
        return -2;
      }
      // TODO support resolving well-known service names from:
      // http://www.iana.org/assignments/service-names-port-numbers/service-names-port-numbers.txt
      return -8;
    }
  }
  if (!node) {
    if (family === 0) {
      family = 2;
    }
    if ((flags & 1) === 0) {
      if (family === 2) {
        addr = _htonl(2130706433);
      } else {
        addr = [ 0, 0, 0, _htonl(1) ];
      }
    }
    ai = allocaddrinfo(family, type, proto, null, addr, port);
    (growMemViews(), HEAPU32)[((out) >>> 2) >>> 0] = ai;
    return 0;
  }
  // try as a numeric address
  node = UTF8ToString(node);
  addr = inetPton4(node);
  if (addr !== null) {
    // incoming node is a valid ipv4 address
    if (family === 0 || family === 2) {
      family = 2;
    } else if (family === 10 && (flags & 8)) {
      addr = [ 0, 0, _htonl(65535), addr ];
      family = 10;
    } else {
      return -2;
    }
  } else {
    addr = inetPton6(node);
    if (addr !== null) {
      // incoming node is a valid ipv6 address
      if (family === 0 || family === 10) {
        family = 10;
      } else {
        return -2;
      }
    }
  }
  if (addr != null) {
    ai = allocaddrinfo(family, type, proto, node, addr, port);
    (growMemViews(), HEAPU32)[((out) >>> 2) >>> 0] = ai;
    return 0;
  }
  if (flags & 4) {
    return -2;
  }
  // try as a hostname
  // resolve the hostname to a temporary fake address
  node = DNS.lookup_name(node);
  addr = inetPton4(node);
  if (family === 0) {
    family = 2;
  } else if (family === 10) {
    addr = [ 0, 0, _htonl(65535), addr ];
  }
  ai = allocaddrinfo(family, type, proto, null, addr, port);
  (growMemViews(), HEAPU32)[((out) >>> 2) >>> 0] = ai;
  return 0;
}

var readSockaddr = (sa, salen) => {
  // family / port offsets are common to both sockaddr_in and sockaddr_in6
  var family = (growMemViews(), HEAP16)[((sa) >>> 1) >>> 0];
  var port = _ntohs((growMemViews(), HEAPU16)[(((sa) + (2)) >>> 1) >>> 0]);
  var addr;
  switch (family) {
   case 2:
    if (salen !== 16) {
      return {
        errno: 28
      };
    }
    addr = (growMemViews(), HEAP32)[(((sa) + (4)) >>> 2) >>> 0];
    addr = inetNtop4(addr);
    break;

   case 10:
    if (salen !== 28) {
      return {
        errno: 28
      };
    }
    addr = [ (growMemViews(), HEAP32)[(((sa) + (8)) >>> 2) >>> 0], (growMemViews(), 
    HEAP32)[(((sa) + (12)) >>> 2) >>> 0], (growMemViews(), HEAP32)[(((sa) + (16)) >>> 2) >>> 0], (growMemViews(), 
    HEAP32)[(((sa) + (20)) >>> 2) >>> 0] ];
    addr = inetNtop6(addr);
    break;

   default:
    return {
      errno: 5
    };
  }
  return {
    family,
    addr,
    port
  };
};

function _getnameinfo(sa, salen, node, nodelen, serv, servlen, flags) {
  sa >>>= 0;
  node >>>= 0;
  serv >>>= 0;
  var info = readSockaddr(sa, salen);
  if (info.errno) {
    return -6;
  }
  var port = info.port;
  var addr = info.addr;
  var overflowed = false;
  if (node && nodelen) {
    var lookup;
    if ((flags & 1) || !(lookup = DNS.lookup_addr(addr))) {
      if (flags & 8) {
        return -2;
      }
    } else {
      addr = lookup;
    }
    var numBytesWrittenExclNull = stringToUTF8(addr, node, nodelen);
    if (numBytesWrittenExclNull + 1 >= nodelen) {
      overflowed = true;
    }
  }
  if (serv && servlen) {
    port = "" + port;
    var numBytesWrittenExclNull = stringToUTF8(port, serv, servlen);
    if (numBytesWrittenExclNull + 1 >= servlen) {
      overflowed = true;
    }
  }
  if (overflowed) {
    // Note: even when we overflow, getnameinfo() is specced to write out the truncated results.
    return -12;
  }
  return 0;
}

var Protocols = {
  list: [],
  map: {}
};

var stringToAscii = (str, buffer) => {
  for (var i = 0; i < str.length; ++i) {
    assert(str.charCodeAt(i) === (str.charCodeAt(i) & 255));
    (growMemViews(), HEAP8)[buffer++ >>> 0] = str.charCodeAt(i);
  }
  // Null-terminate the string
  (growMemViews(), HEAP8)[buffer >>> 0] = 0;
};

var _setprotoent = stayopen => {
  // void setprotoent(int stayopen);
  // Allocate and populate a protoent structure given a name, protocol number and array of aliases
  function allocprotoent(name, proto, aliases) {
    // write name into buffer
    var nameBuf = _malloc(name.length + 1);
    stringToAscii(name, nameBuf);
    // write aliases into buffer
    var j = 0;
    var length = aliases.length;
    var aliasListBuf = _malloc((length + 1) * 4);
    // Use length + 1 so we have space for the terminating NULL ptr.
    for (var i = 0; i < length; i++, j += 4) {
      var alias = aliases[i];
      var aliasBuf = _malloc(alias.length + 1);
      stringToAscii(alias, aliasBuf);
      (growMemViews(), HEAPU32)[(((aliasListBuf) + (j)) >>> 2) >>> 0] = aliasBuf;
    }
    (growMemViews(), HEAPU32)[(((aliasListBuf) + (j)) >>> 2) >>> 0] = 0;
    // Terminating NULL pointer.
    // generate protoent
    var pe = _malloc(12);
    (growMemViews(), HEAPU32)[((pe) >>> 2) >>> 0] = nameBuf;
    (growMemViews(), HEAPU32)[(((pe) + (4)) >>> 2) >>> 0] = aliasListBuf;
    (growMemViews(), HEAP32)[(((pe) + (8)) >>> 2) >>> 0] = proto;
    return pe;
  }
  // Populate the protocol 'database'. The entries are limited to tcp and udp, though it is fairly trivial
  // to add extra entries from /etc/protocols if desired - though not sure if that'd actually be useful.
  var list = Protocols.list;
  var map = Protocols.map;
  if (list.length === 0) {
    var entry = allocprotoent("tcp", 6, [ "TCP" ]);
    list.push(entry);
    map["tcp"] = map["6"] = entry;
    entry = allocprotoent("udp", 17, [ "UDP" ]);
    list.push(entry);
    map["udp"] = map["17"] = entry;
  }
  _setprotoent.index = 0;
};

function _getprotobyname(name) {
  name >>>= 0;
  // struct protoent *getprotobyname(const char *);
  name = UTF8ToString(name);
  _setprotoent(true);
  var result = Protocols.map[name];
  return result;
}

function _llvm_eh_typeid_for(type) {
  type >>>= 0;
  return type;
}

var initRandomFill = () => view => (view.set(crypto.getRandomValues(new Uint8Array(view.byteLength))), 
0);

var randomFill = view => (randomFill = initRandomFill())(view);

function _random_get(buffer, size) {
  buffer >>>= 0;
  size >>>= 0;
  return randomFill((growMemViews(), HEAPU8).subarray(buffer >>> 0, buffer + size >>> 0));
}

function _sqlite3_aggregate_context(...args) {
  abort("missing function: sqlite3_aggregate_context");
}

_sqlite3_aggregate_context.stub = true;

function _sqlite3_backup_finish(...args) {
  abort("missing function: sqlite3_backup_finish");
}

_sqlite3_backup_finish.stub = true;

function _sqlite3_backup_init(...args) {
  abort("missing function: sqlite3_backup_init");
}

_sqlite3_backup_init.stub = true;

function _sqlite3_backup_pagecount(...args) {
  abort("missing function: sqlite3_backup_pagecount");
}

_sqlite3_backup_pagecount.stub = true;

function _sqlite3_backup_remaining(...args) {
  abort("missing function: sqlite3_backup_remaining");
}

_sqlite3_backup_remaining.stub = true;

function _sqlite3_backup_step(...args) {
  abort("missing function: sqlite3_backup_step");
}

_sqlite3_backup_step.stub = true;

function _sqlite3_bind_blob(...args) {
  abort("missing function: sqlite3_bind_blob");
}

_sqlite3_bind_blob.stub = true;

function _sqlite3_bind_double(...args) {
  abort("missing function: sqlite3_bind_double");
}

_sqlite3_bind_double.stub = true;

function _sqlite3_bind_int64(...args) {
  abort("missing function: sqlite3_bind_int64");
}

_sqlite3_bind_int64.stub = true;

function _sqlite3_bind_null(...args) {
  abort("missing function: sqlite3_bind_null");
}

_sqlite3_bind_null.stub = true;

function _sqlite3_bind_parameter_count(...args) {
  abort("missing function: sqlite3_bind_parameter_count");
}

_sqlite3_bind_parameter_count.stub = true;

function _sqlite3_bind_parameter_name(...args) {
  abort("missing function: sqlite3_bind_parameter_name");
}

_sqlite3_bind_parameter_name.stub = true;

function _sqlite3_bind_text(...args) {
  abort("missing function: sqlite3_bind_text");
}

_sqlite3_bind_text.stub = true;

function _sqlite3_blob_bytes(...args) {
  abort("missing function: sqlite3_blob_bytes");
}

_sqlite3_blob_bytes.stub = true;

function _sqlite3_blob_close(...args) {
  abort("missing function: sqlite3_blob_close");
}

_sqlite3_blob_close.stub = true;

function _sqlite3_blob_open(...args) {
  abort("missing function: sqlite3_blob_open");
}

_sqlite3_blob_open.stub = true;

function _sqlite3_blob_read(...args) {
  abort("missing function: sqlite3_blob_read");
}

_sqlite3_blob_read.stub = true;

function _sqlite3_blob_write(...args) {
  abort("missing function: sqlite3_blob_write");
}

_sqlite3_blob_write.stub = true;

function _sqlite3_busy_timeout(...args) {
  abort("missing function: sqlite3_busy_timeout");
}

_sqlite3_busy_timeout.stub = true;

function _sqlite3_changes(...args) {
  abort("missing function: sqlite3_changes");
}

_sqlite3_changes.stub = true;

function _sqlite3_close(...args) {
  abort("missing function: sqlite3_close");
}

_sqlite3_close.stub = true;

function _sqlite3_close_v2(...args) {
  abort("missing function: sqlite3_close_v2");
}

_sqlite3_close_v2.stub = true;

function _sqlite3_column_blob(...args) {
  abort("missing function: sqlite3_column_blob");
}

_sqlite3_column_blob.stub = true;

function _sqlite3_column_bytes(...args) {
  abort("missing function: sqlite3_column_bytes");
}

_sqlite3_column_bytes.stub = true;

function _sqlite3_column_count(...args) {
  abort("missing function: sqlite3_column_count");
}

_sqlite3_column_count.stub = true;

function _sqlite3_column_decltype(...args) {
  abort("missing function: sqlite3_column_decltype");
}

_sqlite3_column_decltype.stub = true;

function _sqlite3_column_double(...args) {
  abort("missing function: sqlite3_column_double");
}

_sqlite3_column_double.stub = true;

function _sqlite3_column_int64(...args) {
  abort("missing function: sqlite3_column_int64");
}

_sqlite3_column_int64.stub = true;

function _sqlite3_column_name(...args) {
  abort("missing function: sqlite3_column_name");
}

_sqlite3_column_name.stub = true;

function _sqlite3_column_text(...args) {
  abort("missing function: sqlite3_column_text");
}

_sqlite3_column_text.stub = true;

function _sqlite3_column_type(...args) {
  abort("missing function: sqlite3_column_type");
}

_sqlite3_column_type.stub = true;

function _sqlite3_complete(...args) {
  abort("missing function: sqlite3_complete");
}

_sqlite3_complete.stub = true;

function _sqlite3_context_db_handle(...args) {
  abort("missing function: sqlite3_context_db_handle");
}

_sqlite3_context_db_handle.stub = true;

function _sqlite3_create_collation_v2(...args) {
  abort("missing function: sqlite3_create_collation_v2");
}

_sqlite3_create_collation_v2.stub = true;

function _sqlite3_create_function_v2(...args) {
  abort("missing function: sqlite3_create_function_v2");
}

_sqlite3_create_function_v2.stub = true;

function _sqlite3_create_window_function(...args) {
  abort("missing function: sqlite3_create_window_function");
}

_sqlite3_create_window_function.stub = true;

function _sqlite3_data_count(...args) {
  abort("missing function: sqlite3_data_count");
}

_sqlite3_data_count.stub = true;

function _sqlite3_db_config(...args) {
  abort("missing function: sqlite3_db_config");
}

_sqlite3_db_config.stub = true;

function _sqlite3_db_handle(...args) {
  abort("missing function: sqlite3_db_handle");
}

_sqlite3_db_handle.stub = true;

function _sqlite3_deserialize(...args) {
  abort("missing function: sqlite3_deserialize");
}

_sqlite3_deserialize.stub = true;

function _sqlite3_errcode(...args) {
  abort("missing function: sqlite3_errcode");
}

_sqlite3_errcode.stub = true;

function _sqlite3_errmsg(...args) {
  abort("missing function: sqlite3_errmsg");
}

_sqlite3_errmsg.stub = true;

function _sqlite3_errstr(...args) {
  abort("missing function: sqlite3_errstr");
}

_sqlite3_errstr.stub = true;

function _sqlite3_exec(...args) {
  abort("missing function: sqlite3_exec");
}

_sqlite3_exec.stub = true;

function _sqlite3_expanded_sql(...args) {
  abort("missing function: sqlite3_expanded_sql");
}

_sqlite3_expanded_sql.stub = true;

function _sqlite3_extended_errcode(...args) {
  abort("missing function: sqlite3_extended_errcode");
}

_sqlite3_extended_errcode.stub = true;

function _sqlite3_finalize(...args) {
  abort("missing function: sqlite3_finalize");
}

_sqlite3_finalize.stub = true;

function _sqlite3_free(...args) {
  abort("missing function: sqlite3_free");
}

_sqlite3_free.stub = true;

function _sqlite3_get_autocommit(...args) {
  abort("missing function: sqlite3_get_autocommit");
}

_sqlite3_get_autocommit.stub = true;

function _sqlite3_initialize(...args) {
  abort("missing function: sqlite3_initialize");
}

_sqlite3_initialize.stub = true;

function _sqlite3_interrupt(...args) {
  abort("missing function: sqlite3_interrupt");
}

_sqlite3_interrupt.stub = true;

function _sqlite3_last_insert_rowid(...args) {
  abort("missing function: sqlite3_last_insert_rowid");
}

_sqlite3_last_insert_rowid.stub = true;

function _sqlite3_libversion(...args) {
  abort("missing function: sqlite3_libversion");
}

_sqlite3_libversion.stub = true;

function _sqlite3_libversion_number(...args) {
  abort("missing function: sqlite3_libversion_number");
}

_sqlite3_libversion_number.stub = true;

function _sqlite3_limit(...args) {
  abort("missing function: sqlite3_limit");
}

_sqlite3_limit.stub = true;

function _sqlite3_malloc64(...args) {
  abort("missing function: sqlite3_malloc64");
}

_sqlite3_malloc64.stub = true;

function _sqlite3_open_v2(...args) {
  abort("missing function: sqlite3_open_v2");
}

_sqlite3_open_v2.stub = true;

function _sqlite3_prepare_v2(...args) {
  abort("missing function: sqlite3_prepare_v2");
}

_sqlite3_prepare_v2.stub = true;

function _sqlite3_progress_handler(...args) {
  abort("missing function: sqlite3_progress_handler");
}

_sqlite3_progress_handler.stub = true;

function _sqlite3_reset(...args) {
  abort("missing function: sqlite3_reset");
}

_sqlite3_reset.stub = true;

function _sqlite3_result_blob(...args) {
  abort("missing function: sqlite3_result_blob");
}

_sqlite3_result_blob.stub = true;

function _sqlite3_result_double(...args) {
  abort("missing function: sqlite3_result_double");
}

_sqlite3_result_double.stub = true;

function _sqlite3_result_error(...args) {
  abort("missing function: sqlite3_result_error");
}

_sqlite3_result_error.stub = true;

function _sqlite3_result_error_nomem(...args) {
  abort("missing function: sqlite3_result_error_nomem");
}

_sqlite3_result_error_nomem.stub = true;

function _sqlite3_result_error_toobig(...args) {
  abort("missing function: sqlite3_result_error_toobig");
}

_sqlite3_result_error_toobig.stub = true;

function _sqlite3_result_int64(...args) {
  abort("missing function: sqlite3_result_int64");
}

_sqlite3_result_int64.stub = true;

function _sqlite3_result_null(...args) {
  abort("missing function: sqlite3_result_null");
}

_sqlite3_result_null.stub = true;

function _sqlite3_result_text(...args) {
  abort("missing function: sqlite3_result_text");
}

_sqlite3_result_text.stub = true;

function _sqlite3_serialize(...args) {
  abort("missing function: sqlite3_serialize");
}

_sqlite3_serialize.stub = true;

function _sqlite3_set_authorizer(...args) {
  abort("missing function: sqlite3_set_authorizer");
}

_sqlite3_set_authorizer.stub = true;

function _sqlite3_sleep(...args) {
  abort("missing function: sqlite3_sleep");
}

_sqlite3_sleep.stub = true;

function _sqlite3_step(...args) {
  abort("missing function: sqlite3_step");
}

_sqlite3_step.stub = true;

function _sqlite3_stmt_busy(...args) {
  abort("missing function: sqlite3_stmt_busy");
}

_sqlite3_stmt_busy.stub = true;

function _sqlite3_stmt_readonly(...args) {
  abort("missing function: sqlite3_stmt_readonly");
}

_sqlite3_stmt_readonly.stub = true;

function _sqlite3_stricmp(...args) {
  abort("missing function: sqlite3_stricmp");
}

_sqlite3_stricmp.stub = true;

function _sqlite3_threadsafe(...args) {
  abort("missing function: sqlite3_threadsafe");
}

_sqlite3_threadsafe.stub = true;

function _sqlite3_total_changes(...args) {
  abort("missing function: sqlite3_total_changes");
}

_sqlite3_total_changes.stub = true;

function _sqlite3_trace_v2(...args) {
  abort("missing function: sqlite3_trace_v2");
}

_sqlite3_trace_v2.stub = true;

function _sqlite3_user_data(...args) {
  abort("missing function: sqlite3_user_data");
}

_sqlite3_user_data.stub = true;

function _sqlite3_value_blob(...args) {
  abort("missing function: sqlite3_value_blob");
}

_sqlite3_value_blob.stub = true;

function _sqlite3_value_bytes(...args) {
  abort("missing function: sqlite3_value_bytes");
}

_sqlite3_value_bytes.stub = true;

function _sqlite3_value_double(...args) {
  abort("missing function: sqlite3_value_double");
}

_sqlite3_value_double.stub = true;

function _sqlite3_value_int64(...args) {
  abort("missing function: sqlite3_value_int64");
}

_sqlite3_value_int64.stub = true;

function _sqlite3_value_text(...args) {
  abort("missing function: sqlite3_value_text");
}

_sqlite3_value_text.stub = true;

function _sqlite3_value_type(...args) {
  abort("missing function: sqlite3_value_type");
}

_sqlite3_value_type.stub = true;

function _wasmfs_create_provider_backend(...args) {
  abort("missing function: wasmfs_create_provider_backend");
}

_wasmfs_create_provider_backend.stub = true;

function _wgpuBindGroupAddRef(...args) {
  abort("missing function: wgpuBindGroupAddRef");
}

_wgpuBindGroupAddRef.stub = true;

function _wgpuBindGroupLayoutRelease(...args) {
  abort("missing function: wgpuBindGroupLayoutRelease");
}

_wgpuBindGroupLayoutRelease.stub = true;

function _wgpuBindGroupRelease(...args) {
  abort("missing function: wgpuBindGroupRelease");
}

_wgpuBindGroupRelease.stub = true;

function _wgpuBufferAddRef(...args) {
  abort("missing function: wgpuBufferAddRef");
}

_wgpuBufferAddRef.stub = true;

function _wgpuBufferGetConstMappedRange(...args) {
  abort("missing function: wgpuBufferGetConstMappedRange");
}

_wgpuBufferGetConstMappedRange.stub = true;

function _wgpuBufferGetMappedRange(...args) {
  abort("missing function: wgpuBufferGetMappedRange");
}

_wgpuBufferGetMappedRange.stub = true;

function _wgpuBufferGetSize(...args) {
  abort("missing function: wgpuBufferGetSize");
}

_wgpuBufferGetSize.stub = true;

function _wgpuBufferGetUsage(...args) {
  abort("missing function: wgpuBufferGetUsage");
}

_wgpuBufferGetUsage.stub = true;

function _wgpuBufferMapAsync(...args) {
  abort("missing function: wgpuBufferMapAsync");
}

_wgpuBufferMapAsync.stub = true;

function _wgpuBufferRelease(...args) {
  abort("missing function: wgpuBufferRelease");
}

_wgpuBufferRelease.stub = true;

function _wgpuBufferUnmap(...args) {
  abort("missing function: wgpuBufferUnmap");
}

_wgpuBufferUnmap.stub = true;

function _wgpuCommandBufferRelease(...args) {
  abort("missing function: wgpuCommandBufferRelease");
}

_wgpuCommandBufferRelease.stub = true;

function _wgpuCommandEncoderBeginComputePass(...args) {
  abort("missing function: wgpuCommandEncoderBeginComputePass");
}

_wgpuCommandEncoderBeginComputePass.stub = true;

function _wgpuCommandEncoderBeginRenderPass(...args) {
  abort("missing function: wgpuCommandEncoderBeginRenderPass");
}

_wgpuCommandEncoderBeginRenderPass.stub = true;

function _wgpuCommandEncoderCopyBufferToBuffer(...args) {
  abort("missing function: wgpuCommandEncoderCopyBufferToBuffer");
}

_wgpuCommandEncoderCopyBufferToBuffer.stub = true;

function _wgpuCommandEncoderCopyTextureToBuffer(...args) {
  abort("missing function: wgpuCommandEncoderCopyTextureToBuffer");
}

_wgpuCommandEncoderCopyTextureToBuffer.stub = true;

function _wgpuCommandEncoderCopyTextureToTexture(...args) {
  abort("missing function: wgpuCommandEncoderCopyTextureToTexture");
}

_wgpuCommandEncoderCopyTextureToTexture.stub = true;

function _wgpuCommandEncoderFinish(...args) {
  abort("missing function: wgpuCommandEncoderFinish");
}

_wgpuCommandEncoderFinish.stub = true;

function _wgpuCommandEncoderRelease(...args) {
  abort("missing function: wgpuCommandEncoderRelease");
}

_wgpuCommandEncoderRelease.stub = true;

function _wgpuCommandEncoderResolveQuerySet(...args) {
  abort("missing function: wgpuCommandEncoderResolveQuerySet");
}

_wgpuCommandEncoderResolveQuerySet.stub = true;

function _wgpuComputePassEncoderDispatchWorkgroups(...args) {
  abort("missing function: wgpuComputePassEncoderDispatchWorkgroups");
}

_wgpuComputePassEncoderDispatchWorkgroups.stub = true;

function _wgpuComputePassEncoderDispatchWorkgroupsIndirect(...args) {
  abort("missing function: wgpuComputePassEncoderDispatchWorkgroupsIndirect");
}

_wgpuComputePassEncoderDispatchWorkgroupsIndirect.stub = true;

function _wgpuComputePassEncoderEnd(...args) {
  abort("missing function: wgpuComputePassEncoderEnd");
}

_wgpuComputePassEncoderEnd.stub = true;

function _wgpuComputePassEncoderRelease(...args) {
  abort("missing function: wgpuComputePassEncoderRelease");
}

_wgpuComputePassEncoderRelease.stub = true;

function _wgpuComputePassEncoderSetBindGroup(...args) {
  abort("missing function: wgpuComputePassEncoderSetBindGroup");
}

_wgpuComputePassEncoderSetBindGroup.stub = true;

function _wgpuComputePassEncoderSetPipeline(...args) {
  abort("missing function: wgpuComputePassEncoderSetPipeline");
}

_wgpuComputePassEncoderSetPipeline.stub = true;

function _wgpuComputePipelineGetBindGroupLayout(...args) {
  abort("missing function: wgpuComputePipelineGetBindGroupLayout");
}

_wgpuComputePipelineGetBindGroupLayout.stub = true;

function _wgpuComputePipelineRelease(...args) {
  abort("missing function: wgpuComputePipelineRelease");
}

_wgpuComputePipelineRelease.stub = true;

function _wgpuCreateInstance(...args) {
  abort("missing function: wgpuCreateInstance");
}

_wgpuCreateInstance.stub = true;

function _wgpuDeviceCreateBindGroup(...args) {
  abort("missing function: wgpuDeviceCreateBindGroup");
}

_wgpuDeviceCreateBindGroup.stub = true;

function _wgpuDeviceCreateBindGroupLayout(...args) {
  abort("missing function: wgpuDeviceCreateBindGroupLayout");
}

_wgpuDeviceCreateBindGroupLayout.stub = true;

function _wgpuDeviceCreateBuffer(...args) {
  abort("missing function: wgpuDeviceCreateBuffer");
}

_wgpuDeviceCreateBuffer.stub = true;

function _wgpuDeviceCreateCommandEncoder(...args) {
  abort("missing function: wgpuDeviceCreateCommandEncoder");
}

_wgpuDeviceCreateCommandEncoder.stub = true;

function _wgpuDeviceCreateComputePipeline(...args) {
  abort("missing function: wgpuDeviceCreateComputePipeline");
}

_wgpuDeviceCreateComputePipeline.stub = true;

function _wgpuDeviceCreatePipelineLayout(...args) {
  abort("missing function: wgpuDeviceCreatePipelineLayout");
}

_wgpuDeviceCreatePipelineLayout.stub = true;

function _wgpuDeviceCreateQuerySet(...args) {
  abort("missing function: wgpuDeviceCreateQuerySet");
}

_wgpuDeviceCreateQuerySet.stub = true;

function _wgpuDeviceCreateRenderPipeline(...args) {
  abort("missing function: wgpuDeviceCreateRenderPipeline");
}

_wgpuDeviceCreateRenderPipeline.stub = true;

function _wgpuDeviceCreateSampler(...args) {
  abort("missing function: wgpuDeviceCreateSampler");
}

_wgpuDeviceCreateSampler.stub = true;

function _wgpuDeviceCreateShaderModule(...args) {
  abort("missing function: wgpuDeviceCreateShaderModule");
}

_wgpuDeviceCreateShaderModule.stub = true;

function _wgpuDeviceCreateTexture(...args) {
  abort("missing function: wgpuDeviceCreateTexture");
}

_wgpuDeviceCreateTexture.stub = true;

function _wgpuDeviceGetQueue(...args) {
  abort("missing function: wgpuDeviceGetQueue");
}

_wgpuDeviceGetQueue.stub = true;

function _wgpuDeviceHasFeature(...args) {
  abort("missing function: wgpuDeviceHasFeature");
}

_wgpuDeviceHasFeature.stub = true;

function _wgpuInstanceCreateSurface(...args) {
  abort("missing function: wgpuInstanceCreateSurface");
}

_wgpuInstanceCreateSurface.stub = true;

function _wgpuInstanceRelease(...args) {
  abort("missing function: wgpuInstanceRelease");
}

_wgpuInstanceRelease.stub = true;

function _wgpuInstanceWaitAny(...args) {
  abort("missing function: wgpuInstanceWaitAny");
}

_wgpuInstanceWaitAny.stub = true;

function _wgpuPipelineLayoutRelease(...args) {
  abort("missing function: wgpuPipelineLayoutRelease");
}

_wgpuPipelineLayoutRelease.stub = true;

function _wgpuQuerySetRelease(...args) {
  abort("missing function: wgpuQuerySetRelease");
}

_wgpuQuerySetRelease.stub = true;

function _wgpuQueueRelease(...args) {
  abort("missing function: wgpuQueueRelease");
}

_wgpuQueueRelease.stub = true;

function _wgpuQueueSubmit(...args) {
  abort("missing function: wgpuQueueSubmit");
}

_wgpuQueueSubmit.stub = true;

function _wgpuQueueWriteBuffer(...args) {
  abort("missing function: wgpuQueueWriteBuffer");
}

_wgpuQueueWriteBuffer.stub = true;

function _wgpuQueueWriteTexture(...args) {
  abort("missing function: wgpuQueueWriteTexture");
}

_wgpuQueueWriteTexture.stub = true;

function _wgpuRenderPassEncoderBeginOcclusionQuery(...args) {
  abort("missing function: wgpuRenderPassEncoderBeginOcclusionQuery");
}

_wgpuRenderPassEncoderBeginOcclusionQuery.stub = true;

function _wgpuRenderPassEncoderDraw(...args) {
  abort("missing function: wgpuRenderPassEncoderDraw");
}

_wgpuRenderPassEncoderDraw.stub = true;

function _wgpuRenderPassEncoderDrawIndexed(...args) {
  abort("missing function: wgpuRenderPassEncoderDrawIndexed");
}

_wgpuRenderPassEncoderDrawIndexed.stub = true;

function _wgpuRenderPassEncoderDrawIndexedIndirect(...args) {
  abort("missing function: wgpuRenderPassEncoderDrawIndexedIndirect");
}

_wgpuRenderPassEncoderDrawIndexedIndirect.stub = true;

function _wgpuRenderPassEncoderDrawIndirect(...args) {
  abort("missing function: wgpuRenderPassEncoderDrawIndirect");
}

_wgpuRenderPassEncoderDrawIndirect.stub = true;

function _wgpuRenderPassEncoderEnd(...args) {
  abort("missing function: wgpuRenderPassEncoderEnd");
}

_wgpuRenderPassEncoderEnd.stub = true;

function _wgpuRenderPassEncoderEndOcclusionQuery(...args) {
  abort("missing function: wgpuRenderPassEncoderEndOcclusionQuery");
}

_wgpuRenderPassEncoderEndOcclusionQuery.stub = true;

function _wgpuRenderPassEncoderRelease(...args) {
  abort("missing function: wgpuRenderPassEncoderRelease");
}

_wgpuRenderPassEncoderRelease.stub = true;

function _wgpuRenderPassEncoderSetBindGroup(...args) {
  abort("missing function: wgpuRenderPassEncoderSetBindGroup");
}

_wgpuRenderPassEncoderSetBindGroup.stub = true;

function _wgpuRenderPassEncoderSetIndexBuffer(...args) {
  abort("missing function: wgpuRenderPassEncoderSetIndexBuffer");
}

_wgpuRenderPassEncoderSetIndexBuffer.stub = true;

function _wgpuRenderPassEncoderSetPipeline(...args) {
  abort("missing function: wgpuRenderPassEncoderSetPipeline");
}

_wgpuRenderPassEncoderSetPipeline.stub = true;

function _wgpuRenderPassEncoderSetScissorRect(...args) {
  abort("missing function: wgpuRenderPassEncoderSetScissorRect");
}

_wgpuRenderPassEncoderSetScissorRect.stub = true;

function _wgpuRenderPassEncoderSetStencilReference(...args) {
  abort("missing function: wgpuRenderPassEncoderSetStencilReference");
}

_wgpuRenderPassEncoderSetStencilReference.stub = true;

function _wgpuRenderPassEncoderSetVertexBuffer(...args) {
  abort("missing function: wgpuRenderPassEncoderSetVertexBuffer");
}

_wgpuRenderPassEncoderSetVertexBuffer.stub = true;

function _wgpuRenderPassEncoderSetViewport(...args) {
  abort("missing function: wgpuRenderPassEncoderSetViewport");
}

_wgpuRenderPassEncoderSetViewport.stub = true;

function _wgpuRenderPipelineGetBindGroupLayout(...args) {
  abort("missing function: wgpuRenderPipelineGetBindGroupLayout");
}

_wgpuRenderPipelineGetBindGroupLayout.stub = true;

function _wgpuRenderPipelineRelease(...args) {
  abort("missing function: wgpuRenderPipelineRelease");
}

_wgpuRenderPipelineRelease.stub = true;

function _wgpuSamplerAddRef(...args) {
  abort("missing function: wgpuSamplerAddRef");
}

_wgpuSamplerAddRef.stub = true;

function _wgpuSamplerRelease(...args) {
  abort("missing function: wgpuSamplerRelease");
}

_wgpuSamplerRelease.stub = true;

function _wgpuShaderModuleRelease(...args) {
  abort("missing function: wgpuShaderModuleRelease");
}

_wgpuShaderModuleRelease.stub = true;

function _wgpuSurfaceConfigure(...args) {
  abort("missing function: wgpuSurfaceConfigure");
}

_wgpuSurfaceConfigure.stub = true;

function _wgpuSurfaceGetCurrentTexture(...args) {
  abort("missing function: wgpuSurfaceGetCurrentTexture");
}

_wgpuSurfaceGetCurrentTexture.stub = true;

function _wgpuTextureAddRef(...args) {
  abort("missing function: wgpuTextureAddRef");
}

_wgpuTextureAddRef.stub = true;

function _wgpuTextureCreateView(...args) {
  abort("missing function: wgpuTextureCreateView");
}

_wgpuTextureCreateView.stub = true;

function _wgpuTextureGetDepthOrArrayLayers(...args) {
  abort("missing function: wgpuTextureGetDepthOrArrayLayers");
}

_wgpuTextureGetDepthOrArrayLayers.stub = true;

function _wgpuTextureGetDimension(...args) {
  abort("missing function: wgpuTextureGetDimension");
}

_wgpuTextureGetDimension.stub = true;

function _wgpuTextureGetFormat(...args) {
  abort("missing function: wgpuTextureGetFormat");
}

_wgpuTextureGetFormat.stub = true;

function _wgpuTextureGetHeight(...args) {
  abort("missing function: wgpuTextureGetHeight");
}

_wgpuTextureGetHeight.stub = true;

function _wgpuTextureGetMipLevelCount(...args) {
  abort("missing function: wgpuTextureGetMipLevelCount");
}

_wgpuTextureGetMipLevelCount.stub = true;

function _wgpuTextureGetUsage(...args) {
  abort("missing function: wgpuTextureGetUsage");
}

_wgpuTextureGetUsage.stub = true;

function _wgpuTextureGetWidth(...args) {
  abort("missing function: wgpuTextureGetWidth");
}

_wgpuTextureGetWidth.stub = true;

function _wgpuTextureRelease(...args) {
  abort("missing function: wgpuTextureRelease");
}

_wgpuTextureRelease.stub = true;

function _wgpuTextureViewAddRef(...args) {
  abort("missing function: wgpuTextureViewAddRef");
}

_wgpuTextureViewAddRef.stub = true;

function _wgpuTextureViewRelease(...args) {
  abort("missing function: wgpuTextureViewRelease");
}

_wgpuTextureViewRelease.stub = true;

var stringToUTF8OnStack = str => {
  var size = lengthBytesUTF8(str) + 1;
  var ret = stackAlloc(size);
  stringToUTF8(str, ret, size);
  return ret;
};

var MEMFS = {
  createBackend(opts) {
    return _wasmfs_create_memory_backend();
  }
};

var PATH = {
  isAbs: path => path.charAt(0) === "/",
  splitPath: filename => {
    var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
    return splitPathRe.exec(filename).slice(1);
  },
  normalizeArray: (parts, allowAboveRoot) => {
    // if the path tries to go above the root, `up` ends up > 0
    var up = 0;
    for (var i = parts.length - 1; i >= 0; i--) {
      var last = parts[i];
      if (last === ".") {
        parts.splice(i, 1);
      } else if (last === "..") {
        parts.splice(i, 1);
        up++;
      } else if (up) {
        parts.splice(i, 1);
        up--;
      }
    }
    // if the path is allowed to go above the root, restore leading ..s
    if (allowAboveRoot) {
      for (;up; up--) {
        parts.unshift("..");
      }
    }
    return parts;
  },
  normalize: path => {
    var isAbsolute = PATH.isAbs(path), trailingSlash = path.slice(-1) === "/";
    // Normalize the path
    path = PATH.normalizeArray(path.split("/").filter(p => !!p), !isAbsolute).join("/");
    if (!path && !isAbsolute) {
      path = ".";
    }
    if (path && trailingSlash) {
      path += "/";
    }
    return (isAbsolute ? "/" : "") + path;
  },
  dirname: path => {
    var result = PATH.splitPath(path), root = result[0], dir = result[1];
    if (!root && !dir) {
      // No dirname whatsoever
      return ".";
    }
    if (dir) {
      // It has a dirname, strip trailing slash
      dir = dir.slice(0, -1);
    }
    return root + dir;
  },
  basename: path => path && path.match(/([^\/]+|\/)\/*$/)[1],
  join: (...paths) => PATH.normalize(paths.join("/")),
  join2: (l, r) => PATH.normalize(l + "/" + r)
};

var withStackSave = f => {
  var stack = stackSave();
  var ret = f();
  stackRestore(stack);
  return ret;
};

var readI53FromI64 = ptr => (growMemViews(), HEAPU32)[((ptr) >>> 2) >>> 0] + (growMemViews(), 
HEAP32)[(((ptr) + (4)) >>> 2) >>> 0] * 4294967296;

var readI53FromU64 = ptr => (growMemViews(), HEAPU32)[((ptr) >>> 2) >>> 0] + (growMemViews(), 
HEAPU32)[(((ptr) + (4)) >>> 2) >>> 0] * 4294967296;

var FS_mknod = (path, mode, dev) => FS.handleError(withStackSave(() => {
  var pathBuffer = stringToUTF8OnStack(path);
  return __wasmfs_mknod(pathBuffer, mode, dev);
}));

var FS_create = (path, mode = 438) => {
  mode &= 4095;
  mode |= 32768;
  return FS_mknod(path, mode, 0);
};

var FS_fileDataToTypedArray = data => {
  if (typeof data == "string") {
    data = intArrayFromString(data, true);
  }
  if (!data.subarray) {
    data = new Uint8Array(data);
  }
  return data;
};

var FS_writeFile = (path, data) => {
  var sp = stackSave();
  var pathBuffer = stringToUTF8OnStack(path);
  data = FS_fileDataToTypedArray(data);
  var len = data.length;
  var dataBuffer = _malloc(len);
  assert(dataBuffer);
  (growMemViews(), HEAPU8).set(data, dataBuffer >>> 0);
  var ret = __wasmfs_write_file(pathBuffer, dataBuffer, len);
  _free(dataBuffer);
  stackRestore(sp);
  return ret;
};

var FS_createDataFile = (parent, name, fileData, canRead, canWrite, canOwn) => {
  var pathName = name ? parent + "/" + name : parent;
  var mode = FS_getMode(canRead, canWrite);
  if (!wasmFSPreloadingFlushed) {
    // WasmFS code in the wasm is not ready to be called yet. Cache the
    // files we want to create here in JS, and WasmFS will read them
    // later.
    wasmFSPreloadedFiles.push({
      pathName,
      fileData,
      mode
    });
  } else {
    // WasmFS is already running, so create the file normally.
    FS_create(pathName, mode);
    FS_writeFile(pathName, fileData);
  }
};

var asyncLoad = async url => {
  var arrayBuffer = await readAsync(url);
  assert(arrayBuffer, `Loading data file "${url}" failed (no arrayBuffer).`);
  return new Uint8Array(arrayBuffer);
};

var PATH_FS = {
  resolve: (...args) => {
    var resolvedPath = "", resolvedAbsolute = false;
    for (var i = args.length - 1; i >= -1 && !resolvedAbsolute; i--) {
      var path = (i >= 0) ? args[i] : FS.cwd();
      // Skip empty and invalid entries
      if (typeof path != "string") {
        throw new TypeError("Arguments to path.resolve must be strings");
      } else if (!path) {
        return "";
      }
      resolvedPath = path + "/" + resolvedPath;
      resolvedAbsolute = PATH.isAbs(path);
    }
    // At this point the path should be resolved to a full absolute path, but
    // handle relative paths to be safe (might happen when process.cwd() fails)
    resolvedPath = PATH.normalizeArray(resolvedPath.split("/").filter(p => !!p), !resolvedAbsolute).join("/");
    return ((resolvedAbsolute ? "/" : "") + resolvedPath) || ".";
  },
  relative: (from, to) => {
    from = PATH_FS.resolve(from).slice(1);
    to = PATH_FS.resolve(to).slice(1);
    function trim(arr) {
      var start = 0;
      for (;start < arr.length; start++) {
        if (arr[start] !== "") break;
      }
      var end = arr.length - 1;
      for (;end >= 0; end--) {
        if (arr[end] !== "") break;
      }
      if (start > end) return [];
      return arr.slice(start, end - start + 1);
    }
    var fromParts = trim(from.split("/"));
    var toParts = trim(to.split("/"));
    var length = Math.min(fromParts.length, toParts.length);
    var samePartsLength = length;
    for (var i = 0; i < length; i++) {
      if (fromParts[i] !== toParts[i]) {
        samePartsLength = i;
        break;
      }
    }
    var outputParts = [];
    for (var i = samePartsLength; i < fromParts.length; i++) {
      outputParts.push("..");
    }
    outputParts = outputParts.concat(toParts.slice(samePartsLength));
    return outputParts.join("/");
  }
};

var getUniqueRunDependency = id => {
  var orig = id;
  while (1) {
    if (!runDependencyTracking[id]) return id;
    id = orig + Math.random();
  }
};

var preloadPlugins = [];

var FS_handledByPreloadPlugin = async (byteArray, fullname) => {
  // Ensure plugins are ready.
  if (typeof Browser != "undefined") Browser.init();
  for (var plugin of preloadPlugins) {
    if (plugin["canHandle"](fullname)) {
      assert(plugin["handle"].constructor.name === "AsyncFunction", "Filesystem plugin handlers must be async functions (See #24914)");
      return plugin["handle"](byteArray, fullname);
    }
  }
  // If no plugin handled this file then return the original/unmodified
  // byteArray.
  return byteArray;
};

var FS_preloadFile = async (parent, name, url, canRead, canWrite, dontCreateFile, canOwn, preFinish) => {
  // TODO we should allow people to just pass in a complete filename instead
  // of parent and name being that we just join them anyways
  var fullname = name ? PATH_FS.resolve(PATH.join2(parent, name)) : parent;
  var dep = getUniqueRunDependency(`cp ${fullname}`);
  // might have several active requests for the same fullname
  addRunDependency(dep);
  try {
    var byteArray = url;
    if (typeof url == "string") {
      byteArray = await asyncLoad(url);
    }
    byteArray = await FS_handledByPreloadPlugin(byteArray, fullname);
    preFinish?.();
    if (!dontCreateFile) {
      FS_createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
    }
  } finally {
    removeRunDependency(dep);
  }
};

var FS_createPreloadedFile = (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn, preFinish) => {
  FS_preloadFile(parent, name, url, canRead, canWrite, dontCreateFile, canOwn, preFinish).then(onload).catch(onerror);
};

var FS_getMode = (canRead, canWrite) => {
  var mode = 0;
  if (canRead) mode |= 292 | 73;
  if (canWrite) mode |= 146;
  return mode;
};

var FS_modeStringToFlags = str => {
  if (typeof str != "string") return str;
  var flagModes = {
    "r": 0,
    "r+": 2,
    "w": 512 | 64 | 1,
    "w+": 512 | 64 | 2,
    "a": 1024 | 64 | 1,
    "a+": 1024 | 64 | 2
  };
  var flags = flagModes[str];
  if (typeof flags == "undefined") {
    throw new Error(`Unknown file open mode: ${str}`);
  }
  return flags;
};

var FS_mkdir = (path, mode = 511) => FS.handleError(withStackSave(() => {
  var buffer = stringToUTF8OnStack(path);
  return __wasmfs_mkdir(buffer, mode);
}));

/**
   * @param {number=} mode Optionally, the mode to create in. Uses mkdir's
   *                       default if not set.
   */ var FS_mkdirTree = (path, mode) => {
  var dirs = path.split("/");
  var d = "";
  for (var dir of dirs) {
    if (!dir) continue;
    if (d || PATH.isAbs(path)) d += "/";
    d += dir;
    try {
      FS_mkdir(d, mode);
    } catch (e) {
      if (e.errno != 20) throw e;
    }
  }
};

var FS_unlink = path => withStackSave(() => {
  var buffer = stringToUTF8OnStack(path);
  return __wasmfs_unlink(buffer);
});

var wasmFS$backends = {};

var wasmFSDevices = {};

var wasmFSDeviceStreams = {};

var FS = {
  ErrnoError: class extends Error {
    name="ErrnoError";
    message="FS error";
    constructor(code) {
      super();
      this.errno = code;
    }
  },
  handleError(returnValue) {
    // Assume errors correspond to negative returnValues
    // since some functions like _wasmfs_open() return positive
    // numbers on success (some callers of this function may need to negate the parameter).
    if (returnValue < 0) {
      throw new FS.ErrnoError(-returnValue);
    }
    return returnValue;
  },
  createDataFile(parent, name, fileData, canRead, canWrite, canOwn) {
    FS_createDataFile(parent, name, fileData, canRead, canWrite, canOwn);
  },
  createPath(parent, path, canRead, canWrite) {
    // Cache file path directory names.
    var parts = path.split("/").reverse();
    while (parts.length) {
      var part = parts.pop();
      if (!part) continue;
      var current = PATH.join2(parent, part);
      if (!wasmFSPreloadingFlushed) {
        wasmFSPreloadedDirs.push({
          parentPath: parent,
          childName: part
        });
      } else {
        try {
          FS.mkdir(current);
        } catch (e) {
          if (e.errno != 20) throw e;
        }
      }
      parent = current;
    }
    return current;
  },
  createPreloadedFile(parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn, preFinish) {
    return FS_createPreloadedFile(parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn, preFinish);
  },
  async preloadFile(parent, name, url, canRead, canWrite, dontCreateFile, canOwn, preFinish) {
    return FS_preloadFile(parent, name, url, canRead, canWrite, dontCreateFile, canOwn, preFinish);
  },
  readFile(path, opts = {}) {
    opts.encoding = opts.encoding || "binary";
    if (opts.encoding !== "utf8" && opts.encoding !== "binary") {
      throw new Error(`Invalid encoding type "${opts.encoding}"`);
    }
    var buf, length;
    // Copy the file into a JS buffer on the heap.
    withStackSave(() => {
      var bufPtr = stackAlloc(4);
      var sizePtr = stackAlloc(4);
      FS.handleError(-__wasmfs_read_file(stringToUTF8OnStack(path), bufPtr, sizePtr));
      buf = (growMemViews(), HEAPU32)[((bufPtr) >>> 2) >>> 0];
      length = readI53FromI64(sizePtr);
    });
    // Default return type is binary.
    // The buffer contents exist 8 bytes after the returned pointer.
    return opts.encoding === "utf8" ? UTF8ToString(buf, length) : (growMemViews(), HEAPU8).slice(buf, buf + length);
  },
  cwd: () => UTF8ToString(__wasmfs_get_cwd()),
  analyzePath(path) {
    // TODO: Consider simplifying this API, which for now matches the JS FS.
    var exists = !!FS.findObject(path);
    return {
      exists,
      object: {
        contents: exists ? FS.readFile(path) : null
      }
    };
  },
  mkdir: (path, mode) => FS_mkdir(path, mode),
  mkdirTree: (path, mode) => FS_mkdirTree(path, mode),
  rmdir: path => FS.handleError(withStackSave(() => __wasmfs_rmdir(stringToUTF8OnStack(path)))),
  open: (path, flags, mode = 438) => withStackSave(() => {
    flags = FS_modeStringToFlags(flags);
    var buffer = stringToUTF8OnStack(path);
    var fd = FS.handleError(__wasmfs_open(buffer, flags, mode));
    return {
      fd
    };
  }),
  create: (path, mode) => FS_create(path, mode),
  close: stream => FS.handleError(-__wasmfs_close(stream.fd)),
  unlink: path => FS_unlink(path),
  chdir: path => withStackSave(() => __wasmfs_chdir(stringToUTF8OnStack(path))),
  read(stream, buffer, offset, length, position) {
    var seeking = typeof position != "undefined";
    var dataBuffer = _malloc(length);
    var bytesRead;
    if (seeking) {
      bytesRead = __wasmfs_pread(stream.fd, dataBuffer, length, BigInt(position));
    } else {
      bytesRead = __wasmfs_read(stream.fd, dataBuffer, length);
    }
    if (bytesRead > 0) {
      buffer.set((growMemViews(), HEAPU8).subarray(dataBuffer >>> 0, dataBuffer + bytesRead >>> 0), offset);
    }
    _free(dataBuffer);
    return FS.handleError(bytesRead);
  },
  write(stream, buffer, offset, length, position, canOwn) {
    var seeking = typeof position != "undefined";
    var dataBuffer = _malloc(length);
    for (var i = 0; i < length; i++) {
      (growMemViews(), HEAP8)[(dataBuffer) + (i) >>> 0] = buffer[offset + i];
    }
    var bytesRead;
    if (seeking) {
      bytesRead = __wasmfs_pwrite(stream.fd, dataBuffer, length, BigInt(position));
    } else {
      bytesRead = __wasmfs_write(stream.fd, dataBuffer, length);
    }
    _free(dataBuffer);
    return FS.handleError(bytesRead);
  },
  writeFile: (path, data) => FS_writeFile(path, data),
  mmap: (stream, length, offset, prot, flags) => {
    var buf = FS.handleError(__wasmfs_mmap(length, prot, flags, stream.fd, BigInt(offset)));
    return {
      ptr: buf,
      allocated: true
    };
  },
  msync: (stream, bufferPtr, offset, length, mmapFlags) => {
    assert(offset === 0);
    // TODO: assert that stream has the fd corresponding to the mapped buffer (bufferPtr).
    return FS.handleError(__wasmfs_msync(bufferPtr, length, mmapFlags));
  },
  munmap: (addr, length) => (FS.handleError(__wasmfs_munmap(addr, length))),
  symlink: (target, linkpath) => withStackSave(() => (__wasmfs_symlink(stringToUTF8OnStack(target), stringToUTF8OnStack(linkpath)))),
  readlink(path) {
    return withStackSave(() => {
      var bufPtr = stackAlloc(4);
      FS.handleError(__wasmfs_readlink(stringToUTF8OnStack(path), bufPtr));
      var readBuffer = (growMemViews(), HEAPU32)[((bufPtr) >>> 2) >>> 0];
      return UTF8ToString(readBuffer);
    });
  },
  statBufToObject(statBuf) {
    // i53/u53 are enough for times and ino in practice.
    return {
      dev: (growMemViews(), HEAPU32)[((statBuf) >>> 2) >>> 0],
      mode: (growMemViews(), HEAPU32)[(((statBuf) + (4)) >>> 2) >>> 0],
      nlink: (growMemViews(), HEAPU32)[(((statBuf) + (8)) >>> 2) >>> 0],
      uid: (growMemViews(), HEAPU32)[(((statBuf) + (12)) >>> 2) >>> 0],
      gid: (growMemViews(), HEAPU32)[(((statBuf) + (16)) >>> 2) >>> 0],
      rdev: (growMemViews(), HEAPU32)[(((statBuf) + (20)) >>> 2) >>> 0],
      size: readI53FromI64((statBuf) + (24)),
      blksize: (growMemViews(), HEAP32)[(((statBuf) + (32)) >>> 2) >>> 0],
      blocks: (growMemViews(), HEAP32)[(((statBuf) + (36)) >>> 2) >>> 0],
      atime: readI53FromI64((statBuf) + (40)),
      mtime: readI53FromI64((statBuf) + (56)),
      ctime: readI53FromI64((statBuf) + (72)),
      ino: readI53FromU64((statBuf) + (88))
    };
  },
  stat(path) {
    return withStackSave(() => {
      var statBuf = stackAlloc(96);
      FS.handleError(__wasmfs_stat(stringToUTF8OnStack(path), statBuf));
      return FS.statBufToObject(statBuf);
    });
  },
  lstat(path) {
    return withStackSave(() => {
      var statBuf = stackAlloc(96);
      FS.handleError(__wasmfs_lstat(stringToUTF8OnStack(path), statBuf));
      return FS.statBufToObject(statBuf);
    });
  },
  chmod(path, mode) {
    return FS.handleError(withStackSave(() => {
      var buffer = stringToUTF8OnStack(path);
      return __wasmfs_chmod(buffer, mode);
    }));
  },
  lchmod(path, mode) {
    return FS.handleError(withStackSave(() => {
      var buffer = stringToUTF8OnStack(path);
      return __wasmfs_lchmod(buffer, mode);
    }));
  },
  fchmod(fd, mode) {
    return FS.handleError(__wasmfs_fchmod(fd, mode));
  },
  utime: (path, atime, mtime) => (FS.handleError(withStackSave(() => (__wasmfs_utime(stringToUTF8OnStack(path), atime, mtime))))),
  truncate(path, len) {
    return FS.handleError(withStackSave(() => (__wasmfs_truncate(stringToUTF8OnStack(path), BigInt(len)))));
  },
  ftruncate(fd, len) {
    return FS.handleError(__wasmfs_ftruncate(fd, BigInt(len)));
  },
  findObject(path) {
    var result = withStackSave(() => __wasmfs_identify(stringToUTF8OnStack(path)));
    if (result == 44) {
      return null;
    }
    return {
      isFolder: result == 31,
      isDevice: false
    };
  },
  readdir: path => withStackSave(() => {
    var pathBuffer = stringToUTF8OnStack(path);
    var entries = [];
    var state = __wasmfs_readdir_start(pathBuffer);
    if (!state) {
      // TODO: The old FS threw an ErrnoError here.
      throw new Error("No such directory");
    }
    var entry;
    while (entry = __wasmfs_readdir_get(state)) {
      entries.push(UTF8ToString(entry));
    }
    __wasmfs_readdir_finish(state);
    return entries;
  }),
  mount: (type, opts, mountpoint) => {
    if (typeof type == "string") {
      // The filesystem was not included, and instead we have an error
      // message stored in the variable.
      throw type;
    }
    var backendPointer = type.createBackend(opts);
    return FS.handleError(withStackSave(() => __wasmfs_mount(stringToUTF8OnStack(mountpoint), backendPointer)));
  },
  unmount: mountpoint => (FS.handleError(withStackSave(() => _wasmfs_unmount(stringToUTF8OnStack(mountpoint))))),
  mknod: (path, mode, dev) => FS_mknod(path, mode, dev),
  makedev: (ma, mi) => ((ma) << 8 | (mi)),
  registerDevice(dev, ops) {
    var backendPointer = _wasmfs_create_jsimpl_backend();
    var definedOps = {
      userRead: ops.read,
      userWrite: ops.write,
      allocFile: file => {
        wasmFSDeviceStreams[file] = {};
      },
      freeFile: file => {
        wasmFSDeviceStreams[file] = undefined;
      },
      getSize: file => {},
      // Devices cannot be resized.
      setSize: (file, size) => 0,
      read: (file, buffer, length, offset) => {
        var bufferArray = (growMemViews(), HEAP8).subarray(buffer >>> 0, buffer + length >>> 0);
        try {
          var bytesRead = definedOps.userRead(wasmFSDeviceStreams[file], bufferArray, 0, length, offset);
        } catch (e) {
          return -e.errno;
        }
        (growMemViews(), HEAP8).set(bufferArray, buffer >>> 0);
        return bytesRead;
      },
      write: (file, buffer, length, offset) => {
        var bufferArray = (growMemViews(), HEAP8).subarray(buffer >>> 0, buffer + length >>> 0);
        try {
          var bytesWritten = definedOps.userWrite(wasmFSDeviceStreams[file], bufferArray, 0, length, offset);
        } catch (e) {
          return -e.errno;
        }
        (growMemViews(), HEAP8).set(bufferArray, buffer >>> 0);
        return bytesWritten;
      }
    };
    wasmFS$backends[backendPointer] = definedOps;
    wasmFSDevices[dev] = backendPointer;
  },
  createDevice(parent, name, input, output) {
    if (typeof parent != "string") {
      // The old API allowed parents to be objects, which do not exist in WasmFS.
      throw new Error("Only string paths are accepted");
    }
    var path = PATH.join2(parent, name);
    var mode = FS_getMode(!!input, !!output);
    FS.createDevice.major ??= 64;
    var dev = FS.makedev(FS.createDevice.major++, 0);
    // Create a fake device with a set of stream ops to emulate
    // the old API's createDevice().
    FS.registerDevice(dev, {
      read(stream, buffer, offset, length, pos) {
        var bytesRead = 0;
        for (var i = 0; i < length; i++) {
          var result;
          try {
            result = input();
          } catch (e) {
            throw new FS.ErrnoError(29);
          }
          if (result === undefined && bytesRead === 0) {
            throw new FS.ErrnoError(6);
          }
          if (result === null || result === undefined) break;
          bytesRead++;
          buffer[offset + i] = result;
        }
        return bytesRead;
      },
      write(stream, buffer, offset, length, pos) {
        for (var i = 0; i < length; i++) {
          try {
            output(buffer[offset + i]);
          } catch (e) {
            throw new FS.ErrnoError(29);
          }
        }
        return i;
      }
    });
    return FS.mkdev(path, mode, dev);
  },
  mkdev(path, mode, dev) {
    if (typeof dev === "undefined") {
      dev = mode;
      mode = 438;
    }
    var deviceBackend = wasmFSDevices[dev];
    if (!deviceBackend) {
      throw new Error("Invalid device ID.");
    }
    return FS.handleError(withStackSave(() => (_wasmfs_create_file(stringToUTF8OnStack(path), mode, deviceBackend))));
  },
  rename(oldPath, newPath) {
    return FS.handleError(withStackSave(() => {
      var oldPathBuffer = stringToUTF8OnStack(oldPath);
      var newPathBuffer = stringToUTF8OnStack(newPath);
      return __wasmfs_rename(oldPathBuffer, newPathBuffer);
    }));
  },
  llseek(stream, offset, whence) {
    return FS.handleError(__wasmfs_llseek(stream.fd, BigInt(offset), whence));
  }
};

var getCFunc = ident => {
  var func = Module["_" + ident];
  // closure exported function
  assert(func, `Cannot call unknown function ${ident}, make sure it is exported`);
  return func;
};

var writeArrayToMemory = (array, buffer) => {
  assert(array.length >= 0, "writeArrayToMemory array must have a length (should be an array or typed array)");
  (growMemViews(), HEAP8).set(array, buffer >>> 0);
};

/**
   * @param {string|null=} returnType
   * @param {Array=} argTypes
   * @param {Array=} args
   * @param {Object=} opts
   */ var ccall = (ident, returnType, argTypes, args, opts) => {
  // For fast lookup of conversion functions
  var toC = {
    "string": str => {
      var ret = 0;
      if (str !== null && str !== undefined && str !== 0) {
        // null string
        ret = stringToUTF8OnStack(str);
      }
      return ret;
    },
    "array": arr => {
      var ret = stackAlloc(arr.length);
      writeArrayToMemory(arr, ret);
      return ret;
    }
  };
  function convertReturnValue(ret) {
    if (returnType === "string") {
      return UTF8ToString(ret);
    }
    if (returnType === "pointer") return ret >>> 0;
    if (returnType === "boolean") return Boolean(ret);
    return ret;
  }
  var func = getCFunc(ident);
  var cArgs = [];
  var stack = 0;
  assert(returnType !== "array", 'return type should not be "array"');
  if (args) {
    for (var i = 0; i < args.length; i++) {
      var converter = toC[argTypes[i]];
      if (converter) {
        if (stack === 0) stack = stackSave();
        cArgs[i] = converter(args[i]);
      } else {
        cArgs[i] = args[i];
      }
    }
  }
  var ret = func(...cArgs);
  function onDone(ret) {
    if (stack !== 0) stackRestore(stack);
    return convertReturnValue(ret);
  }
  ret = onDone(ret);
  return ret;
};

/**
   * @param {string=} returnType
   * @param {Array=} argTypes
   * @param {Object=} opts
   */ var cwrap = (ident, returnType, argTypes, opts) => (...args) => ccall(ident, returnType, argTypes, args, opts);

var FS_createPath = FS.createPath;

PThread.init();

Module["requestAnimationFrame"] = MainLoop.requestAnimationFrame;

Module["pauseMainLoop"] = MainLoop.pause;

Module["resumeMainLoop"] = MainLoop.resume;

MainLoop.init();

// End JS library code
// include: postlibrary.js
// This file is included after the automatically-generated JS library code
// but before the wasm module is created.
{
  // With WASM_ESM_INTEGRATION this has to happen at the top level and not
  // delayed until processModuleArgs.
  initMemory();
  // Begin ATMODULES hooks
  if (Module["noExitRuntime"]) noExitRuntime = Module["noExitRuntime"];
  if (Module["preloadPlugins"]) preloadPlugins = Module["preloadPlugins"];
  if (Module["print"]) out = Module["print"];
  if (Module["printErr"]) err = Module["printErr"];
  if (Module["wasmBinary"]) wasmBinary = Module["wasmBinary"];
  // End ATMODULES hooks
  checkIncomingModuleAPI();
  if (Module["arguments"]) programArgs = Module["arguments"];
  if (Module["thisProgram"]) thisProgram = Module["thisProgram"];
  // Assertions on removed incoming Module JS APIs.
  assert(typeof Module["memoryInitializerPrefixURL"] == "undefined", "Module.memoryInitializerPrefixURL option was removed, use Module.locateFile instead");
  assert(typeof Module["pthreadMainPrefixURL"] == "undefined", "Module.pthreadMainPrefixURL option was removed, use Module.locateFile instead");
  assert(typeof Module["cdInitializerPrefixURL"] == "undefined", "Module.cdInitializerPrefixURL option was removed, use Module.locateFile instead");
  assert(typeof Module["filePackagePrefixURL"] == "undefined", "Module.filePackagePrefixURL option was removed, use Module.locateFile instead");
  assert(typeof Module["read"] == "undefined", "Module.read option was removed");
  assert(typeof Module["readAsync"] == "undefined", "Module.readAsync option was removed (modify readAsync in JS)");
  assert(typeof Module["readBinary"] == "undefined", "Module.readBinary option was removed (modify readBinary in JS)");
  assert(typeof Module["setWindowTitle"] == "undefined", "Module.setWindowTitle option was removed (modify emscripten_set_window_title in JS)");
  assert(typeof Module["TOTAL_MEMORY"] == "undefined", "Module.TOTAL_MEMORY has been renamed Module.INITIAL_MEMORY");
  assert(typeof Module["ENVIRONMENT"] == "undefined", "Module.ENVIRONMENT has been deprecated. To force the environment, use the ENVIRONMENT compile-time option (for example, -sENVIRONMENT=web or -sENVIRONMENT=node)");
  assert(typeof Module["STACK_SIZE"] == "undefined", "STACK_SIZE can no longer be set at runtime.  Use -sSTACK_SIZE at link time");
  if (Module["preInit"]) {
    if (typeof Module["preInit"] == "function") Module["preInit"] = [ Module["preInit"] ];
    while (Module["preInit"].length > 0) {
      Module["preInit"].shift()();
    }
  }
  consumedModuleProp("preInit");
}

// Begin runtime exports
Module["callMain"] = callMain;

Module["ENV"] = ENV;

Module["addRunDependency"] = addRunDependency;

Module["removeRunDependency"] = removeRunDependency;

Module["ccall"] = ccall;

Module["cwrap"] = cwrap;

Module["FS_preloadFile"] = FS_preloadFile;

Module["FS_unlink"] = FS_unlink;

Module["FS_createPath"] = FS_createPath;

Module["FS"] = FS;

Module["FS_createDataFile"] = FS_createDataFile;

var missingLibrarySymbols = [ "writeI53ToI64", "writeI53ToI64Clamped", "writeI53ToI64Signaling", "writeI53ToU64Clamped", "writeI53ToU64Signaling", "convertI32PairToI53", "convertI32PairToI53Checked", "convertU32PairToI53", "getTempRet0", "createNamedFunction", "strError", "jstoi_q", "autoResumeAudioContext", "getDynCaller", "dynCall", "asmjsMangle", "mmapAlloc", "addOnInit", "addOnPostCtor", "addOnPreMain", "STACK_SIZE", "STACK_ALIGN", "POINTER_SIZE", "ASSERTIONS", "convertJsFunctionToWasm", "getEmptyTableSlot", "updateTableMap", "getFunctionAddress", "addFunction", "removeFunction", "intArrayToString", "AsciiToString", "UTF16ToString", "stringToUTF16", "lengthBytesUTF16", "UTF32ToString", "stringToUTF32", "lengthBytesUTF32", "stringToNewUTF8", "registerFocusEventCallback", "fillDeviceOrientationEventData", "registerDeviceOrientationEventCallback", "fillDeviceMotionEventData", "registerDeviceMotionEventCallback", "screenOrientation", "fillOrientationChangeEventData", "registerOrientationChangeEventCallback", "fillFullscreenChangeEventData", "registerFullscreenChangeEventCallback", "JSEvents_requestFullscreen", "JSEvents_resizeCanvasForFullscreen", "registerRestoreOldStyle", "hideEverythingExceptGivenElement", "restoreHiddenElements", "setLetterbox", "softFullscreenResizeWebGLRenderTarget", "doRequestFullscreen", "fillPointerlockChangeEventData", "registerPointerlockChangeEventCallback", "registerPointerlockErrorEventCallback", "requestPointerLock", "fillVisibilityChangeEventData", "registerVisibilityChangeEventCallback", "registerTouchEventCallback", "fillGamepadEventData", "registerGamepadEventCallback", "registerBeforeUnloadEventCallback", "fillBatteryEventData", "registerBatteryEventCallback", "setCanvasElementSizeCallingThread", "setCanvasElementSizeMainThread", "setCanvasElementSize", "getCanvasSizeCallingThread", "getCanvasSizeMainThread", "getCanvasElementSize", "jsStackTrace", "getCallstack", "convertPCtoSourceLocation", "flush_NO_FILESYSTEM", "wasiRightsToMuslOFlags", "wasiOFlagsToMuslOFlags", "safeSetTimeout", "setImmediateWrapped", "safeRequestAnimationFrame", "clearImmediateWrapped", "registerPostMainLoop", "registerPreMainLoop", "getPromise", "makePromise", "addPromise", "idsToPromises", "makePromiseCallback", "incrementUncaughtExceptionCount", "decrementUncaughtExceptionCount", "Browser_asyncPrepareDataCounter", "arraySum", "addDays", "wasmfsNodeConvertNodeCode", "wasmfsTry", "wasmfsNodeFixStat", "wasmfsNodeLstat", "wasmfsNodeFstat", "heapObjectForWebGLType", "toTypedArrayIndex", "webgl_enable_ANGLE_instanced_arrays", "webgl_enable_OES_vertex_array_object", "webgl_enable_WEBGL_draw_buffers", "webgl_enable_WEBGL_multi_draw", "webgl_enable_EXT_polygon_offset_clamp", "webgl_enable_EXT_clip_control", "webgl_enable_WEBGL_polygon_mode", "emscriptenWebGLGet", "computeUnpackAlignedImageSize", "colorChannelsInGlTextureFormat", "emscriptenWebGLGetTexPixelData", "emscriptenWebGLGetUniform", "webglGetProgramUniformLocation", "webglGetUniformLocation", "webglPrepareUniformLocationsBeforeFirstUse", "webglGetLeftBracePos", "emscriptenWebGLGetVertexAttrib", "__glGetActiveAttribOrUniform", "writeGLArray", "emscripten_webgl_destroy_context_before_on_calling_thread", "registerWebGlEventCallback", "runAndAbortIfError", "ALLOC_NORMAL", "ALLOC_STACK", "allocate", "writeStringToMemory", "writeAsciiToMemory", "allocateUTF8", "allocateUTF8OnStack", "demangle", "stackTrace", "getNativeTypeSize" ];

missingLibrarySymbols.forEach(missingLibrarySymbol);

var unexportedSymbols = [ "run", "out", "err", "abort", "wasmExports", "writeStackCookie", "checkStackCookie", "readI53FromI64", "readI53FromU64", "INT53_MAX", "INT53_MIN", "bigintToI53Checked", "HEAP8", "HEAP16", "HEAP32", "HEAPU32", "HEAPF64", "HEAP64", "HEAPU64", "stackSave", "stackRestore", "stackAlloc", "setTempRet0", "ptrToString", "zeroMemory", "exitJS", "getHeapMax", "growMemory", "withStackSave", "ERRNO_CODES", "inetPton4", "inetNtop4", "inetPton6", "inetNtop6", "readSockaddr", "writeSockaddr", "DNS", "Protocols", "Sockets", "timers", "warnOnce", "readEmAsmArgsArray", "readEmAsmArgs", "runEmAsmFunction", "runMainThreadEmAsm", "getExecutableName", "handleException", "keepRuntimeAlive", "runtimeKeepalivePush", "runtimeKeepalivePop", "callUserCallback", "maybeExit", "asyncLoad", "alignMemory", "HandleAllocator", "wasmTable", "wasmMemory", "getUniqueRunDependency", "noExitRuntime", "addOnPreRun", "addOnExit", "addOnPostRun", "freeTableIndexes", "functionsInTableMap", "setValue", "getValue", "PATH", "PATH_FS", "UTF8Decoder", "UTF8ArrayToString", "UTF8ToString", "stringToUTF8Array", "stringToUTF8", "lengthBytesUTF8", "intArrayFromString", "stringToAscii", "UTF16Decoder", "stringToUTF8OnStack", "writeArrayToMemory", "JSEvents", "registerKeyEventCallback", "specialHTMLTargets", "maybeCStringToJsString", "findEventTarget", "findCanvasEventTarget", "getBoundingClientRect", "fillMouseEventData", "registerMouseEventCallback", "registerWheelEventCallback", "registerUiEventCallback", "currentFullscreenStrategy", "restoreOldWindowedStyle", "UNWIND_CACHE", "ExitStatus", "getEnvStrings", "checkWasiClock", "initRandomFill", "randomFill", "emSetImmediate", "emClearImmediate_deps", "emClearImmediate", "promiseMap", "uncaughtExceptionCount", "exceptionLast", "exceptionCaught", "ExceptionInfo", "findMatchingCatch", "getExceptionMessageCommon", "incrementExceptionRefcount", "decrementExceptionRefcount", "getExceptionMessage", "Browser", "requestFullscreen", "requestFullScreen", "setCanvasSize", "getUserMedia", "createContext", "getPreloadedImageData__data", "wget", "MONTH_DAYS_REGULAR", "MONTH_DAYS_LEAP", "MONTH_DAYS_REGULAR_CUMULATIVE", "MONTH_DAYS_LEAP_CUMULATIVE", "isLeapYear", "ydayFromDate", "preloadPlugins", "FS_createPreloadedFile", "FS_modeStringToFlags", "FS_getMode", "FS_fileDataToTypedArray", "FS_stdin_getChar_buffer", "FS_stdin_getChar", "FS_createDevice", "FS_readFile", "MEMFS", "wasmFSPreloadedFiles", "wasmFSPreloadedDirs", "wasmFSPreloadingFlushed", "wasmFSDevices", "wasmFSDeviceStreams", "FS_mknod", "FS_create", "FS_writeFile", "FS_mkdir", "FS_mkdirTree", "wasmFS$JSMemoryFiles", "wasmFS$backends", "wasmFS$JSMemoryRanges", "wasmfsNodeIsWindows", "wasmfsOPFSDirectoryHandles", "wasmfsOPFSFileHandles", "wasmfsOPFSAccessHandles", "wasmfsOPFSBlobs", "wasmfsOPFSProxyFinish", "wasmfsOPFSGetOrCreateFile", "wasmfsOPFSGetOrCreateDir", "tempFixedLengthArray", "miniTempWebGLFloatBuffers", "miniTempWebGLIntBuffers", "GL", "AL", "GLUT", "EGL", "GLEW", "IDBStore", "SDL", "SDL_gfx", "waitAsyncPolyfilled", "print", "printErr", "jstoi_s", "PThread", "terminateWorker", "cleanupThread", "registerTLSInit", "spawnThread", "exitOnMainThread", "proxyToMainThread", "proxiedJSCallArgs", "invokeEntryPoint", "checkMailbox" ];

unexportedSymbols.forEach(unexportedRuntimeSymbol);

// End runtime exports
// Begin JS library exports
// End JS library exports
// end include: postlibrary.js
// proxiedFunctionTable specifies the list of functions that can be called
// either synchronously or asynchronously from other threads in postMessage()d
// or internally queued events. This way a pthread in a Worker can synchronously
// access e.g. the DOM on the main thread.
var proxiedFunctionTable = [ _proc_exit, exitOnMainThread, pthreadCreateProxied, __setitimer_js, _emscripten_get_element_css_size, _emscripten_set_keydown_callback_on_thread, _emscripten_set_keyup_callback_on_thread, _emscripten_set_mousedown_callback_on_thread, _emscripten_set_mousemove_callback_on_thread, _emscripten_set_mouseup_callback_on_thread, _emscripten_set_resize_callback_on_thread, _emscripten_set_wheel_callback_on_thread, _environ_get, _environ_sizes_get, _getaddrinfo ];

function checkIncomingModuleAPI() {
  ignoredModuleProp("fetchSettings");
  ignoredModuleProp("logReadFiles");
  ignoredModuleProp("loadSplitModule");
  ignoredModuleProp("onMalloc");
  ignoredModuleProp("onRealloc");
  ignoredModuleProp("onFree");
  ignoredModuleProp("onSbrkGrow");
  ignoredModuleProp("onCOSCacheHit");
  ignoredModuleProp("onCOSCacheMiss");
  ignoredModuleProp("onCOSStore");
}

var ASM_CONSTS = {
  20731052: () => {
    (async () => {
      try {
        const adapter = await navigator.gpu.requestAdapter();
        const wanted = [ "dual-source-blending", "float32-filterable", "rg11b10ufloat-renderable", "bgra8unorm-storage", "shader-f16", "depth32float-stencil8", "texture-formats-tier1", "texture-formats-tier2", "indirect-first-instance", "clip-distances" ];
        const requiredFeatures = wanted.filter(f => adapter.features.has(f));
        const wantLimits = [ "maxStorageTexturesPerShaderStage", "maxStorageBuffersPerShaderStage", "maxSampledTexturesPerShaderStage", "maxSamplersPerShaderStage", "maxUniformBuffersPerShaderStage", "maxComputeWorkgroupSizeX", "maxComputeWorkgroupSizeY", "maxComputeWorkgroupSizeZ", "maxComputeInvocationsPerWorkgroup", "maxComputeWorkgroupStorageSize", "maxComputeWorkgroupsPerDimension", "maxStorageBufferBindingSize", "maxUniformBufferBindingSize", "maxBufferSize", "maxBindGroups", "maxBindingsPerBindGroup", "maxTextureDimension2D", "maxTextureDimension3D", "maxTextureArrayLayers", "maxColorAttachments", "maxColorAttachmentBytesPerSample" ];
        const requiredLimits = {};
        for (const k of wantLimits) {
          const v = adapter.limits[k];
          if (v !== undefined) requiredLimits[k] = v;
        }
        Module["preinitializedWebGPUDevice"] = await adapter.requestDevice({
          requiredFeatures,
          requiredLimits
        });
        _blender_web_device_ready();
      } catch (e) {
        if (e !== "unwind") console.error("pthread WebGPU device acquire failed:", e);
      }
    })();
  },
  20732458: () => (typeof Module !== "undefined" && Module["preinitializedWebGPUDevice"]) ? 1 : 0,
  20732550: () => {
    if (typeof window !== "undefined" && window.__blenderFileOpenHook) {
      window.__blenderFileOpenHook();
    }
  },
  20732657: $0 => {
    if (typeof window !== "undefined" && window.__blenderSaveDownload) {
      window.__blenderSaveDownload(UTF8ToString($0));
    }
  },
  20732780: () => {
    if (typeof window !== "undefined" && window.__blenderSaveHook) {
      window.__blenderSaveHook();
    }
  },
  20732879: $0 => {
    document.title = UTF8ToString($0);
  }
};

function wgpu_wgsl_cache_query(key) {
  const m = globalThis.__WGSL_CACHE__;
  if (!m) {
    return -1;
  }
  const v = m.get(UTF8ToString(key));
  if (v === undefined) {
    return -1;
  }
  globalThis.__WGSL_CACHE_HIT__ = v;
  return lengthBytesUTF8(v);
}

function wgpu_wgsl_cache_fetch(buf, buf_len) {
  stringToUTF8(globalThis.__WGSL_CACHE_HIT__, buf, buf_len);
  globalThis.__WGSL_CACHE_HIT__ = undefined;
}

function wgpu_wgsl_cache_put(key, val) {
  let m = globalThis.__WGSL_CACHE__;
  if (!m) {
    m = globalThis.__WGSL_CACHE__ = new Map;
  }
  const k = UTF8ToString(key);
  const v = UTF8ToString(val);
  m.set(k, v);
  if (globalThis.__WGSL_CACHE_PUT__) {
    globalThis.__WGSL_CACHE_PUT__(k, v);
  }
}

function _Py_emscripten_runtime() {
  var info;
  if (typeof navigator == "object") {
    info = navigator.userAgent;
  } else if (typeof process == "object") {
    info = "Node.js ".concat(process.version);
  } else {
    info = "UNKNOWN";
  }
  var len = lengthBytesUTF8(info) + 1;
  var res = _malloc(len);
  if (res) stringToUTF8(info, res, len);
  return res;
}

function _Py_CheckEmscriptenSignals_Helper() {
  if (!Module.Py_EmscriptenSignalBuffer) {
    return 0;
  }
  try {
    let result = Module.Py_EmscriptenSignalBuffer[0];
    Module.Py_EmscriptenSignalBuffer[0] = 0;
    return result;
  } catch (e) {
    return 0;
  }
}

function _PyEM_detect_type_reflection() {
  if (!("Function" in WebAssembly)) {
    return false;
  }
  if (WebAssembly.Function.type) {
    Module.PyEM_CountArgs = func => WebAssembly.Function.type(wasmTable.get(func)).parameters.length;
  } else {
    Module.PyEM_CountArgs = func => wasmTable.get(func).type().parameters.length;
  }
  return true;
}

function _PyEM_TrampolineCall_JavaScript(func, arg1, arg2, arg3) {
  return wasmTable.get(func)(arg1, arg2, arg3);
}

function _PyEM_CountFuncParams(func) {
  let n = _PyEM_CountFuncParams.cache.get(func);
  if (n !== undefined) {
    return n;
  }
  n = Module.PyEM_CountArgs(func);
  _PyEM_CountFuncParams.cache.set(func, n);
  return n;
}

_PyEM_CountFuncParams.cache = new Map;

// Imports from the Wasm binary.
var _blender_web_device_ready = Module["_blender_web_device_ready"] = makeInvalidEarlyAccess("_blender_web_device_ready");

var _main = Module["_main"] = makeInvalidEarlyAccess("_main");

var _blender_web_mount_provider = Module["_blender_web_mount_provider"] = makeInvalidEarlyAccess("_blender_web_mount_provider");

var _fflush = makeInvalidEarlyAccess("_fflush");

var _malloc = makeInvalidEarlyAccess("_malloc");

var _free = makeInvalidEarlyAccess("_free");

var _pthread_self = makeInvalidEarlyAccess("_pthread_self");

var _wgpu_capture_w = Module["_wgpu_capture_w"] = makeInvalidEarlyAccess("_wgpu_capture_w");

var _wgpu_capture_h = Module["_wgpu_capture_h"] = makeInvalidEarlyAccess("_wgpu_capture_h");

var _wgpu_capture_bpr = Module["_wgpu_capture_bpr"] = makeInvalidEarlyAccess("_wgpu_capture_bpr");

var _wgpu_capture_bpp = Module["_wgpu_capture_bpp"] = makeInvalidEarlyAccess("_wgpu_capture_bpp");

var _wgpu_capture_ready = Module["_wgpu_capture_ready"] = makeInvalidEarlyAccess("_wgpu_capture_ready");

var _wgpu_capture_ptr = Module["_wgpu_capture_ptr"] = makeInvalidEarlyAccess("_wgpu_capture_ptr");

var _wgpu_capture_map = Module["_wgpu_capture_map"] = makeInvalidEarlyAccess("_wgpu_capture_map");

var _blender_web_set_has_fsaccess = Module["_blender_web_set_has_fsaccess"] = makeInvalidEarlyAccess("_blender_web_set_has_fsaccess");

var _blender_web_file_open_at = Module["_blender_web_file_open_at"] = makeInvalidEarlyAccess("_blender_web_file_open_at");

var _blender_web_file_save_at = Module["_blender_web_file_save_at"] = makeInvalidEarlyAccess("_blender_web_file_save_at");

var _ntohs = makeInvalidEarlyAccess("_ntohs");

var _htons = makeInvalidEarlyAccess("_htons");

var _htonl = makeInvalidEarlyAccess("_htonl");

var __emscripten_tls_init = makeInvalidEarlyAccess("__emscripten_tls_init");

var _emscripten_builtin_memalign = makeInvalidEarlyAccess("_emscripten_builtin_memalign");

var __emscripten_run_callback_on_thread = makeInvalidEarlyAccess("__emscripten_run_callback_on_thread");

var __emscripten_thread_init = makeInvalidEarlyAccess("__emscripten_thread_init");

var ___set_thread_state = makeInvalidEarlyAccess("___set_thread_state");

var __emscripten_thread_crashed = makeInvalidEarlyAccess("__emscripten_thread_crashed");

var _emscripten_stack_get_end = makeInvalidEarlyAccess("_emscripten_stack_get_end");

var _emscripten_stack_get_base = makeInvalidEarlyAccess("_emscripten_stack_get_base");

var _emscripten_proxy_execute_queue = makeInvalidEarlyAccess("_emscripten_proxy_execute_queue");

var _emscripten_proxy_finish = makeInvalidEarlyAccess("_emscripten_proxy_finish");

var __emscripten_run_js_on_main_thread_done = makeInvalidEarlyAccess("__emscripten_run_js_on_main_thread_done");

var __emscripten_run_js_on_main_thread = makeInvalidEarlyAccess("__emscripten_run_js_on_main_thread");

var __emscripten_thread_free_data = makeInvalidEarlyAccess("__emscripten_thread_free_data");

var __emscripten_thread_exit = makeInvalidEarlyAccess("__emscripten_thread_exit");

var __emscripten_timeout = makeInvalidEarlyAccess("__emscripten_timeout");

var __emscripten_check_mailbox = makeInvalidEarlyAccess("__emscripten_check_mailbox");

var _setThrew = makeInvalidEarlyAccess("_setThrew");

var __emscripten_tempret_set = makeInvalidEarlyAccess("__emscripten_tempret_set");

var _emscripten_stack_init = makeInvalidEarlyAccess("_emscripten_stack_init");

var _emscripten_stack_set_limits = makeInvalidEarlyAccess("_emscripten_stack_set_limits");

var _emscripten_stack_get_free = makeInvalidEarlyAccess("_emscripten_stack_get_free");

var __emscripten_stack_restore = makeInvalidEarlyAccess("__emscripten_stack_restore");

var __emscripten_stack_alloc = makeInvalidEarlyAccess("__emscripten_stack_alloc");

var _emscripten_stack_get_current = makeInvalidEarlyAccess("_emscripten_stack_get_current");

var ___cxa_decrement_exception_refcount = makeInvalidEarlyAccess("___cxa_decrement_exception_refcount");

var ___cxa_increment_exception_refcount = makeInvalidEarlyAccess("___cxa_increment_exception_refcount");

var ___get_exception_message = makeInvalidEarlyAccess("___get_exception_message");

var ___cxa_can_catch = makeInvalidEarlyAccess("___cxa_can_catch");

var ___cxa_get_exception_ptr = makeInvalidEarlyAccess("___cxa_get_exception_ptr");

var __wasmfs_read_file = makeInvalidEarlyAccess("__wasmfs_read_file");

var __wasmfs_write_file = makeInvalidEarlyAccess("__wasmfs_write_file");

var __wasmfs_mkdir = makeInvalidEarlyAccess("__wasmfs_mkdir");

var __wasmfs_rmdir = makeInvalidEarlyAccess("__wasmfs_rmdir");

var __wasmfs_open = makeInvalidEarlyAccess("__wasmfs_open");

var __wasmfs_mknod = makeInvalidEarlyAccess("__wasmfs_mknod");

var __wasmfs_unlink = makeInvalidEarlyAccess("__wasmfs_unlink");

var __wasmfs_chdir = makeInvalidEarlyAccess("__wasmfs_chdir");

var __wasmfs_symlink = makeInvalidEarlyAccess("__wasmfs_symlink");

var __wasmfs_readlink = makeInvalidEarlyAccess("__wasmfs_readlink");

var __wasmfs_write = makeInvalidEarlyAccess("__wasmfs_write");

var __wasmfs_pwrite = makeInvalidEarlyAccess("__wasmfs_pwrite");

var __wasmfs_chmod = makeInvalidEarlyAccess("__wasmfs_chmod");

var __wasmfs_fchmod = makeInvalidEarlyAccess("__wasmfs_fchmod");

var __wasmfs_lchmod = makeInvalidEarlyAccess("__wasmfs_lchmod");

var __wasmfs_llseek = makeInvalidEarlyAccess("__wasmfs_llseek");

var __wasmfs_rename = makeInvalidEarlyAccess("__wasmfs_rename");

var __wasmfs_read = makeInvalidEarlyAccess("__wasmfs_read");

var __wasmfs_pread = makeInvalidEarlyAccess("__wasmfs_pread");

var __wasmfs_truncate = makeInvalidEarlyAccess("__wasmfs_truncate");

var __wasmfs_ftruncate = makeInvalidEarlyAccess("__wasmfs_ftruncate");

var __wasmfs_close = makeInvalidEarlyAccess("__wasmfs_close");

var __wasmfs_mmap = makeInvalidEarlyAccess("__wasmfs_mmap");

var __wasmfs_msync = makeInvalidEarlyAccess("__wasmfs_msync");

var __wasmfs_munmap = makeInvalidEarlyAccess("__wasmfs_munmap");

var __wasmfs_utime = makeInvalidEarlyAccess("__wasmfs_utime");

var __wasmfs_stat = makeInvalidEarlyAccess("__wasmfs_stat");

var __wasmfs_lstat = makeInvalidEarlyAccess("__wasmfs_lstat");

var __wasmfs_mount = makeInvalidEarlyAccess("__wasmfs_mount");

var __wasmfs_identify = makeInvalidEarlyAccess("__wasmfs_identify");

var __wasmfs_readdir_start = makeInvalidEarlyAccess("__wasmfs_readdir_start");

var __wasmfs_readdir_get = makeInvalidEarlyAccess("__wasmfs_readdir_get");

var __wasmfs_readdir_finish = makeInvalidEarlyAccess("__wasmfs_readdir_finish");

var __wasmfs_get_cwd = makeInvalidEarlyAccess("__wasmfs_get_cwd");

var _wasmfs_create_jsimpl_backend = makeInvalidEarlyAccess("_wasmfs_create_jsimpl_backend");

var _wasmfs_create_memory_backend = makeInvalidEarlyAccess("_wasmfs_create_memory_backend");

var __wasmfs_opfs_record_entry = makeInvalidEarlyAccess("__wasmfs_opfs_record_entry");

var _wasmfs_create_file = makeInvalidEarlyAccess("_wasmfs_create_file");

var _wasmfs_unmount = makeInvalidEarlyAccess("_wasmfs_unmount");

var _wasmfs_flush = makeInvalidEarlyAccess("_wasmfs_flush");

var __indirect_function_table = makeInvalidEarlyAccess("__indirect_function_table");

var _Py_EMSCRIPTEN_SIGNAL_HANDLING = Module["_Py_EMSCRIPTEN_SIGNAL_HANDLING"] = makeInvalidEarlyAccess("_Py_EMSCRIPTEN_SIGNAL_HANDLING");

var wasmTable = makeInvalidEarlyAccess("wasmTable");

function assignWasmExports(wasmExports) {
  assert(typeof wasmExports["blender_web_device_ready"] != "undefined", "missing Wasm export: blender_web_device_ready");
  assert(typeof wasmExports["__main_argc_argv"] != "undefined", "missing Wasm export: __main_argc_argv");
  assert(typeof wasmExports["blender_web_mount_provider"] != "undefined", "missing Wasm export: blender_web_mount_provider");
  assert(typeof wasmExports["fflush"] != "undefined", "missing Wasm export: fflush");
  assert(typeof wasmExports["malloc"] != "undefined", "missing Wasm export: malloc");
  assert(typeof wasmExports["free"] != "undefined", "missing Wasm export: free");
  assert(typeof wasmExports["pthread_self"] != "undefined", "missing Wasm export: pthread_self");
  assert(typeof wasmExports["wgpu_capture_w"] != "undefined", "missing Wasm export: wgpu_capture_w");
  assert(typeof wasmExports["wgpu_capture_h"] != "undefined", "missing Wasm export: wgpu_capture_h");
  assert(typeof wasmExports["wgpu_capture_bpr"] != "undefined", "missing Wasm export: wgpu_capture_bpr");
  assert(typeof wasmExports["wgpu_capture_bpp"] != "undefined", "missing Wasm export: wgpu_capture_bpp");
  assert(typeof wasmExports["wgpu_capture_ready"] != "undefined", "missing Wasm export: wgpu_capture_ready");
  assert(typeof wasmExports["wgpu_capture_ptr"] != "undefined", "missing Wasm export: wgpu_capture_ptr");
  assert(typeof wasmExports["wgpu_capture_map"] != "undefined", "missing Wasm export: wgpu_capture_map");
  assert(typeof wasmExports["blender_web_set_has_fsaccess"] != "undefined", "missing Wasm export: blender_web_set_has_fsaccess");
  assert(typeof wasmExports["blender_web_file_open_at"] != "undefined", "missing Wasm export: blender_web_file_open_at");
  assert(typeof wasmExports["blender_web_file_save_at"] != "undefined", "missing Wasm export: blender_web_file_save_at");
  assert(typeof wasmExports["ntohs"] != "undefined", "missing Wasm export: ntohs");
  assert(typeof wasmExports["htons"] != "undefined", "missing Wasm export: htons");
  assert(typeof wasmExports["htonl"] != "undefined", "missing Wasm export: htonl");
  assert(typeof wasmExports["_emscripten_tls_init"] != "undefined", "missing Wasm export: _emscripten_tls_init");
  assert(typeof wasmExports["emscripten_builtin_memalign"] != "undefined", "missing Wasm export: emscripten_builtin_memalign");
  assert(typeof wasmExports["_emscripten_run_callback_on_thread"] != "undefined", "missing Wasm export: _emscripten_run_callback_on_thread");
  assert(typeof wasmExports["_emscripten_thread_init"] != "undefined", "missing Wasm export: _emscripten_thread_init");
  assert(typeof wasmExports["__set_thread_state"] != "undefined", "missing Wasm export: __set_thread_state");
  assert(typeof wasmExports["_emscripten_thread_crashed"] != "undefined", "missing Wasm export: _emscripten_thread_crashed");
  assert(typeof wasmExports["emscripten_stack_get_end"] != "undefined", "missing Wasm export: emscripten_stack_get_end");
  assert(typeof wasmExports["emscripten_stack_get_base"] != "undefined", "missing Wasm export: emscripten_stack_get_base");
  assert(typeof wasmExports["emscripten_proxy_execute_queue"] != "undefined", "missing Wasm export: emscripten_proxy_execute_queue");
  assert(typeof wasmExports["emscripten_proxy_finish"] != "undefined", "missing Wasm export: emscripten_proxy_finish");
  assert(typeof wasmExports["_emscripten_run_js_on_main_thread_done"] != "undefined", "missing Wasm export: _emscripten_run_js_on_main_thread_done");
  assert(typeof wasmExports["_emscripten_run_js_on_main_thread"] != "undefined", "missing Wasm export: _emscripten_run_js_on_main_thread");
  assert(typeof wasmExports["_emscripten_thread_free_data"] != "undefined", "missing Wasm export: _emscripten_thread_free_data");
  assert(typeof wasmExports["_emscripten_thread_exit"] != "undefined", "missing Wasm export: _emscripten_thread_exit");
  assert(typeof wasmExports["_emscripten_timeout"] != "undefined", "missing Wasm export: _emscripten_timeout");
  assert(typeof wasmExports["_emscripten_check_mailbox"] != "undefined", "missing Wasm export: _emscripten_check_mailbox");
  assert(typeof wasmExports["setThrew"] != "undefined", "missing Wasm export: setThrew");
  assert(typeof wasmExports["_emscripten_tempret_set"] != "undefined", "missing Wasm export: _emscripten_tempret_set");
  assert(typeof wasmExports["emscripten_stack_init"] != "undefined", "missing Wasm export: emscripten_stack_init");
  assert(typeof wasmExports["emscripten_stack_set_limits"] != "undefined", "missing Wasm export: emscripten_stack_set_limits");
  assert(typeof wasmExports["emscripten_stack_get_free"] != "undefined", "missing Wasm export: emscripten_stack_get_free");
  assert(typeof wasmExports["_emscripten_stack_restore"] != "undefined", "missing Wasm export: _emscripten_stack_restore");
  assert(typeof wasmExports["_emscripten_stack_alloc"] != "undefined", "missing Wasm export: _emscripten_stack_alloc");
  assert(typeof wasmExports["emscripten_stack_get_current"] != "undefined", "missing Wasm export: emscripten_stack_get_current");
  assert(typeof wasmExports["__cxa_decrement_exception_refcount"] != "undefined", "missing Wasm export: __cxa_decrement_exception_refcount");
  assert(typeof wasmExports["__cxa_increment_exception_refcount"] != "undefined", "missing Wasm export: __cxa_increment_exception_refcount");
  assert(typeof wasmExports["__get_exception_message"] != "undefined", "missing Wasm export: __get_exception_message");
  assert(typeof wasmExports["__cxa_can_catch"] != "undefined", "missing Wasm export: __cxa_can_catch");
  assert(typeof wasmExports["__cxa_get_exception_ptr"] != "undefined", "missing Wasm export: __cxa_get_exception_ptr");
  assert(typeof wasmExports["_wasmfs_read_file"] != "undefined", "missing Wasm export: _wasmfs_read_file");
  assert(typeof wasmExports["_wasmfs_write_file"] != "undefined", "missing Wasm export: _wasmfs_write_file");
  assert(typeof wasmExports["_wasmfs_mkdir"] != "undefined", "missing Wasm export: _wasmfs_mkdir");
  assert(typeof wasmExports["_wasmfs_rmdir"] != "undefined", "missing Wasm export: _wasmfs_rmdir");
  assert(typeof wasmExports["_wasmfs_open"] != "undefined", "missing Wasm export: _wasmfs_open");
  assert(typeof wasmExports["_wasmfs_mknod"] != "undefined", "missing Wasm export: _wasmfs_mknod");
  assert(typeof wasmExports["_wasmfs_unlink"] != "undefined", "missing Wasm export: _wasmfs_unlink");
  assert(typeof wasmExports["_wasmfs_chdir"] != "undefined", "missing Wasm export: _wasmfs_chdir");
  assert(typeof wasmExports["_wasmfs_symlink"] != "undefined", "missing Wasm export: _wasmfs_symlink");
  assert(typeof wasmExports["_wasmfs_readlink"] != "undefined", "missing Wasm export: _wasmfs_readlink");
  assert(typeof wasmExports["_wasmfs_write"] != "undefined", "missing Wasm export: _wasmfs_write");
  assert(typeof wasmExports["_wasmfs_pwrite"] != "undefined", "missing Wasm export: _wasmfs_pwrite");
  assert(typeof wasmExports["_wasmfs_chmod"] != "undefined", "missing Wasm export: _wasmfs_chmod");
  assert(typeof wasmExports["_wasmfs_fchmod"] != "undefined", "missing Wasm export: _wasmfs_fchmod");
  assert(typeof wasmExports["_wasmfs_lchmod"] != "undefined", "missing Wasm export: _wasmfs_lchmod");
  assert(typeof wasmExports["_wasmfs_llseek"] != "undefined", "missing Wasm export: _wasmfs_llseek");
  assert(typeof wasmExports["_wasmfs_rename"] != "undefined", "missing Wasm export: _wasmfs_rename");
  assert(typeof wasmExports["_wasmfs_read"] != "undefined", "missing Wasm export: _wasmfs_read");
  assert(typeof wasmExports["_wasmfs_pread"] != "undefined", "missing Wasm export: _wasmfs_pread");
  assert(typeof wasmExports["_wasmfs_truncate"] != "undefined", "missing Wasm export: _wasmfs_truncate");
  assert(typeof wasmExports["_wasmfs_ftruncate"] != "undefined", "missing Wasm export: _wasmfs_ftruncate");
  assert(typeof wasmExports["_wasmfs_close"] != "undefined", "missing Wasm export: _wasmfs_close");
  assert(typeof wasmExports["_wasmfs_mmap"] != "undefined", "missing Wasm export: _wasmfs_mmap");
  assert(typeof wasmExports["_wasmfs_msync"] != "undefined", "missing Wasm export: _wasmfs_msync");
  assert(typeof wasmExports["_wasmfs_munmap"] != "undefined", "missing Wasm export: _wasmfs_munmap");
  assert(typeof wasmExports["_wasmfs_utime"] != "undefined", "missing Wasm export: _wasmfs_utime");
  assert(typeof wasmExports["_wasmfs_stat"] != "undefined", "missing Wasm export: _wasmfs_stat");
  assert(typeof wasmExports["_wasmfs_lstat"] != "undefined", "missing Wasm export: _wasmfs_lstat");
  assert(typeof wasmExports["_wasmfs_mount"] != "undefined", "missing Wasm export: _wasmfs_mount");
  assert(typeof wasmExports["_wasmfs_identify"] != "undefined", "missing Wasm export: _wasmfs_identify");
  assert(typeof wasmExports["_wasmfs_readdir_start"] != "undefined", "missing Wasm export: _wasmfs_readdir_start");
  assert(typeof wasmExports["_wasmfs_readdir_get"] != "undefined", "missing Wasm export: _wasmfs_readdir_get");
  assert(typeof wasmExports["_wasmfs_readdir_finish"] != "undefined", "missing Wasm export: _wasmfs_readdir_finish");
  assert(typeof wasmExports["_wasmfs_get_cwd"] != "undefined", "missing Wasm export: _wasmfs_get_cwd");
  assert(typeof wasmExports["wasmfs_create_jsimpl_backend"] != "undefined", "missing Wasm export: wasmfs_create_jsimpl_backend");
  assert(typeof wasmExports["wasmfs_create_memory_backend"] != "undefined", "missing Wasm export: wasmfs_create_memory_backend");
  assert(typeof wasmExports["_wasmfs_opfs_record_entry"] != "undefined", "missing Wasm export: _wasmfs_opfs_record_entry");
  assert(typeof wasmExports["wasmfs_create_file"] != "undefined", "missing Wasm export: wasmfs_create_file");
  assert(typeof wasmExports["wasmfs_unmount"] != "undefined", "missing Wasm export: wasmfs_unmount");
  assert(typeof wasmExports["wasmfs_flush"] != "undefined", "missing Wasm export: wasmfs_flush");
  assert(typeof wasmExports["__indirect_function_table"] != "undefined", "missing Wasm export: __indirect_function_table");
  assert(typeof wasmExports["Py_EMSCRIPTEN_SIGNAL_HANDLING"] != "undefined", "missing Wasm export: Py_EMSCRIPTEN_SIGNAL_HANDLING");
  _blender_web_device_ready = Module["_blender_web_device_ready"] = createExportWrapper("blender_web_device_ready", 0);
  _main = Module["_main"] = createExportWrapper("__main_argc_argv", 2);
  _blender_web_mount_provider = Module["_blender_web_mount_provider"] = createExportWrapper("blender_web_mount_provider", 2);
  _fflush = createExportWrapper("fflush", 1);
  _malloc = createExportWrapper("malloc", 1);
  _free = createExportWrapper("free", 1);
  _pthread_self = wasmExports["pthread_self"];
  _wgpu_capture_w = Module["_wgpu_capture_w"] = createExportWrapper("wgpu_capture_w", 0);
  _wgpu_capture_h = Module["_wgpu_capture_h"] = createExportWrapper("wgpu_capture_h", 0);
  _wgpu_capture_bpr = Module["_wgpu_capture_bpr"] = createExportWrapper("wgpu_capture_bpr", 0);
  _wgpu_capture_bpp = Module["_wgpu_capture_bpp"] = createExportWrapper("wgpu_capture_bpp", 0);
  _wgpu_capture_ready = Module["_wgpu_capture_ready"] = createExportWrapper("wgpu_capture_ready", 0);
  _wgpu_capture_ptr = Module["_wgpu_capture_ptr"] = createExportWrapper("wgpu_capture_ptr", 0);
  _wgpu_capture_map = Module["_wgpu_capture_map"] = createExportWrapper("wgpu_capture_map", 0);
  _blender_web_set_has_fsaccess = Module["_blender_web_set_has_fsaccess"] = createExportWrapper("blender_web_set_has_fsaccess", 1);
  _blender_web_file_open_at = Module["_blender_web_file_open_at"] = createExportWrapper("blender_web_file_open_at", 1);
  _blender_web_file_save_at = Module["_blender_web_file_save_at"] = createExportWrapper("blender_web_file_save_at", 1);
  _ntohs = createExportWrapper("ntohs", 1);
  _htons = createExportWrapper("htons", 1);
  _htonl = createExportWrapper("htonl", 1);
  __emscripten_tls_init = createExportWrapper("_emscripten_tls_init", 0);
  _emscripten_builtin_memalign = createExportWrapper("emscripten_builtin_memalign", 2);
  __emscripten_run_callback_on_thread = createExportWrapper("_emscripten_run_callback_on_thread", 6);
  __emscripten_thread_init = createExportWrapper("_emscripten_thread_init", 6);
  ___set_thread_state = createExportWrapper("__set_thread_state", 4);
  __emscripten_thread_crashed = createExportWrapper("_emscripten_thread_crashed", 0);
  _emscripten_stack_get_end = wasmExports["emscripten_stack_get_end"];
  _emscripten_stack_get_base = wasmExports["emscripten_stack_get_base"];
  _emscripten_proxy_execute_queue = createExportWrapper("emscripten_proxy_execute_queue", 1);
  _emscripten_proxy_finish = createExportWrapper("emscripten_proxy_finish", 1);
  __emscripten_run_js_on_main_thread_done = createExportWrapper("_emscripten_run_js_on_main_thread_done", 3);
  __emscripten_run_js_on_main_thread = createExportWrapper("_emscripten_run_js_on_main_thread", 5);
  __emscripten_thread_free_data = createExportWrapper("_emscripten_thread_free_data", 1);
  __emscripten_thread_exit = createExportWrapper("_emscripten_thread_exit", 1);
  __emscripten_timeout = createExportWrapper("_emscripten_timeout", 2);
  __emscripten_check_mailbox = createExportWrapper("_emscripten_check_mailbox", 0);
  _setThrew = createExportWrapper("setThrew", 2);
  __emscripten_tempret_set = createExportWrapper("_emscripten_tempret_set", 1);
  _emscripten_stack_init = wasmExports["emscripten_stack_init"];
  _emscripten_stack_set_limits = wasmExports["emscripten_stack_set_limits"];
  _emscripten_stack_get_free = wasmExports["emscripten_stack_get_free"];
  __emscripten_stack_restore = wasmExports["_emscripten_stack_restore"];
  __emscripten_stack_alloc = wasmExports["_emscripten_stack_alloc"];
  _emscripten_stack_get_current = wasmExports["emscripten_stack_get_current"];
  ___cxa_decrement_exception_refcount = createExportWrapper("__cxa_decrement_exception_refcount", 1);
  ___cxa_increment_exception_refcount = createExportWrapper("__cxa_increment_exception_refcount", 1);
  ___get_exception_message = createExportWrapper("__get_exception_message", 3);
  ___cxa_can_catch = createExportWrapper("__cxa_can_catch", 3);
  ___cxa_get_exception_ptr = createExportWrapper("__cxa_get_exception_ptr", 1);
  __wasmfs_read_file = createExportWrapper("_wasmfs_read_file", 3);
  __wasmfs_write_file = createExportWrapper("_wasmfs_write_file", 3);
  __wasmfs_mkdir = createExportWrapper("_wasmfs_mkdir", 2);
  __wasmfs_rmdir = createExportWrapper("_wasmfs_rmdir", 1);
  __wasmfs_open = createExportWrapper("_wasmfs_open", 3);
  __wasmfs_mknod = createExportWrapper("_wasmfs_mknod", 3);
  __wasmfs_unlink = createExportWrapper("_wasmfs_unlink", 1);
  __wasmfs_chdir = createExportWrapper("_wasmfs_chdir", 1);
  __wasmfs_symlink = createExportWrapper("_wasmfs_symlink", 2);
  __wasmfs_readlink = createExportWrapper("_wasmfs_readlink", 2);
  __wasmfs_write = createExportWrapper("_wasmfs_write", 3);
  __wasmfs_pwrite = createExportWrapper("_wasmfs_pwrite", 4);
  __wasmfs_chmod = createExportWrapper("_wasmfs_chmod", 2);
  __wasmfs_fchmod = createExportWrapper("_wasmfs_fchmod", 2);
  __wasmfs_lchmod = createExportWrapper("_wasmfs_lchmod", 2);
  __wasmfs_llseek = createExportWrapper("_wasmfs_llseek", 3);
  __wasmfs_rename = createExportWrapper("_wasmfs_rename", 2);
  __wasmfs_read = createExportWrapper("_wasmfs_read", 3);
  __wasmfs_pread = createExportWrapper("_wasmfs_pread", 4);
  __wasmfs_truncate = createExportWrapper("_wasmfs_truncate", 2);
  __wasmfs_ftruncate = createExportWrapper("_wasmfs_ftruncate", 2);
  __wasmfs_close = createExportWrapper("_wasmfs_close", 1);
  __wasmfs_mmap = createExportWrapper("_wasmfs_mmap", 5);
  __wasmfs_msync = createExportWrapper("_wasmfs_msync", 3);
  __wasmfs_munmap = createExportWrapper("_wasmfs_munmap", 2);
  __wasmfs_utime = createExportWrapper("_wasmfs_utime", 3);
  __wasmfs_stat = createExportWrapper("_wasmfs_stat", 2);
  __wasmfs_lstat = createExportWrapper("_wasmfs_lstat", 2);
  __wasmfs_mount = createExportWrapper("_wasmfs_mount", 2);
  __wasmfs_identify = createExportWrapper("_wasmfs_identify", 1);
  __wasmfs_readdir_start = createExportWrapper("_wasmfs_readdir_start", 1);
  __wasmfs_readdir_get = createExportWrapper("_wasmfs_readdir_get", 1);
  __wasmfs_readdir_finish = createExportWrapper("_wasmfs_readdir_finish", 1);
  __wasmfs_get_cwd = createExportWrapper("_wasmfs_get_cwd", 0);
  _wasmfs_create_jsimpl_backend = createExportWrapper("wasmfs_create_jsimpl_backend", 0);
  _wasmfs_create_memory_backend = createExportWrapper("wasmfs_create_memory_backend", 0);
  __wasmfs_opfs_record_entry = createExportWrapper("_wasmfs_opfs_record_entry", 3);
  _wasmfs_create_file = createExportWrapper("wasmfs_create_file", 3);
  _wasmfs_unmount = createExportWrapper("wasmfs_unmount", 1);
  _wasmfs_flush = createExportWrapper("wasmfs_flush", 0);
  __indirect_function_table = wasmTable = wasmExports["__indirect_function_table"];
  _Py_EMSCRIPTEN_SIGNAL_HANDLING = Module["_Py_EMSCRIPTEN_SIGNAL_HANDLING"] = (wasmExports["Py_EMSCRIPTEN_SIGNAL_HANDLING"].value) >>> 0;
}

var wasmImports;

function assignWasmImports() {
  wasmImports = {
    /** @export */ BZ2_bzCompress: _BZ2_bzCompress,
    /** @export */ BZ2_bzCompressEnd: _BZ2_bzCompressEnd,
    /** @export */ BZ2_bzCompressInit: _BZ2_bzCompressInit,
    /** @export */ BZ2_bzDecompress: _BZ2_bzDecompress,
    /** @export */ BZ2_bzDecompressEnd: _BZ2_bzDecompressEnd,
    /** @export */ BZ2_bzDecompressInit: _BZ2_bzDecompressInit,
    /** @export */ BrotliDecoderDecompress: _BrotliDecoderDecompress,
    /** @export */ PyExpat_XML_ErrorString: _PyExpat_XML_ErrorString,
    /** @export */ PyExpat_XML_ExpatVersion: _PyExpat_XML_ExpatVersion,
    /** @export */ PyExpat_XML_ExpatVersionInfo: _PyExpat_XML_ExpatVersionInfo,
    /** @export */ PyExpat_XML_ExternalEntityParserCreate: _PyExpat_XML_ExternalEntityParserCreate,
    /** @export */ PyExpat_XML_FreeContentModel: _PyExpat_XML_FreeContentModel,
    /** @export */ PyExpat_XML_GetBase: _PyExpat_XML_GetBase,
    /** @export */ PyExpat_XML_GetBuffer: _PyExpat_XML_GetBuffer,
    /** @export */ PyExpat_XML_GetCurrentByteIndex: _PyExpat_XML_GetCurrentByteIndex,
    /** @export */ PyExpat_XML_GetCurrentColumnNumber: _PyExpat_XML_GetCurrentColumnNumber,
    /** @export */ PyExpat_XML_GetCurrentLineNumber: _PyExpat_XML_GetCurrentLineNumber,
    /** @export */ PyExpat_XML_GetErrorCode: _PyExpat_XML_GetErrorCode,
    /** @export */ PyExpat_XML_GetFeatureList: _PyExpat_XML_GetFeatureList,
    /** @export */ PyExpat_XML_GetInputContext: _PyExpat_XML_GetInputContext,
    /** @export */ PyExpat_XML_GetSpecifiedAttributeCount: _PyExpat_XML_GetSpecifiedAttributeCount,
    /** @export */ PyExpat_XML_Parse: _PyExpat_XML_Parse,
    /** @export */ PyExpat_XML_ParseBuffer: _PyExpat_XML_ParseBuffer,
    /** @export */ PyExpat_XML_ParserCreate_MM: _PyExpat_XML_ParserCreate_MM,
    /** @export */ PyExpat_XML_ParserFree: _PyExpat_XML_ParserFree,
    /** @export */ PyExpat_XML_SetAllocTrackerActivationThreshold: _PyExpat_XML_SetAllocTrackerActivationThreshold,
    /** @export */ PyExpat_XML_SetAllocTrackerMaximumAmplification: _PyExpat_XML_SetAllocTrackerMaximumAmplification,
    /** @export */ PyExpat_XML_SetAttlistDeclHandler: _PyExpat_XML_SetAttlistDeclHandler,
    /** @export */ PyExpat_XML_SetBase: _PyExpat_XML_SetBase,
    /** @export */ PyExpat_XML_SetCharacterDataHandler: _PyExpat_XML_SetCharacterDataHandler,
    /** @export */ PyExpat_XML_SetCommentHandler: _PyExpat_XML_SetCommentHandler,
    /** @export */ PyExpat_XML_SetDefaultHandler: _PyExpat_XML_SetDefaultHandler,
    /** @export */ PyExpat_XML_SetDefaultHandlerExpand: _PyExpat_XML_SetDefaultHandlerExpand,
    /** @export */ PyExpat_XML_SetElementDeclHandler: _PyExpat_XML_SetElementDeclHandler,
    /** @export */ PyExpat_XML_SetElementHandler: _PyExpat_XML_SetElementHandler,
    /** @export */ PyExpat_XML_SetEncoding: _PyExpat_XML_SetEncoding,
    /** @export */ PyExpat_XML_SetEndCdataSectionHandler: _PyExpat_XML_SetEndCdataSectionHandler,
    /** @export */ PyExpat_XML_SetEndDoctypeDeclHandler: _PyExpat_XML_SetEndDoctypeDeclHandler,
    /** @export */ PyExpat_XML_SetEndElementHandler: _PyExpat_XML_SetEndElementHandler,
    /** @export */ PyExpat_XML_SetEndNamespaceDeclHandler: _PyExpat_XML_SetEndNamespaceDeclHandler,
    /** @export */ PyExpat_XML_SetEntityDeclHandler: _PyExpat_XML_SetEntityDeclHandler,
    /** @export */ PyExpat_XML_SetExternalEntityRefHandler: _PyExpat_XML_SetExternalEntityRefHandler,
    /** @export */ PyExpat_XML_SetHashSalt: _PyExpat_XML_SetHashSalt,
    /** @export */ PyExpat_XML_SetNamespaceDeclHandler: _PyExpat_XML_SetNamespaceDeclHandler,
    /** @export */ PyExpat_XML_SetNotStandaloneHandler: _PyExpat_XML_SetNotStandaloneHandler,
    /** @export */ PyExpat_XML_SetNotationDeclHandler: _PyExpat_XML_SetNotationDeclHandler,
    /** @export */ PyExpat_XML_SetParamEntityParsing: _PyExpat_XML_SetParamEntityParsing,
    /** @export */ PyExpat_XML_SetProcessingInstructionHandler: _PyExpat_XML_SetProcessingInstructionHandler,
    /** @export */ PyExpat_XML_SetReparseDeferralEnabled: _PyExpat_XML_SetReparseDeferralEnabled,
    /** @export */ PyExpat_XML_SetReturnNSTriplet: _PyExpat_XML_SetReturnNSTriplet,
    /** @export */ PyExpat_XML_SetSkippedEntityHandler: _PyExpat_XML_SetSkippedEntityHandler,
    /** @export */ PyExpat_XML_SetStartCdataSectionHandler: _PyExpat_XML_SetStartCdataSectionHandler,
    /** @export */ PyExpat_XML_SetStartDoctypeDeclHandler: _PyExpat_XML_SetStartDoctypeDeclHandler,
    /** @export */ PyExpat_XML_SetStartElementHandler: _PyExpat_XML_SetStartElementHandler,
    /** @export */ PyExpat_XML_SetStartNamespaceDeclHandler: _PyExpat_XML_SetStartNamespaceDeclHandler,
    /** @export */ PyExpat_XML_SetUnknownEncodingHandler: _PyExpat_XML_SetUnknownEncodingHandler,
    /** @export */ PyExpat_XML_SetUnparsedEntityDeclHandler: _PyExpat_XML_SetUnparsedEntityDeclHandler,
    /** @export */ PyExpat_XML_SetUserData: _PyExpat_XML_SetUserData,
    /** @export */ PyExpat_XML_SetXmlDeclHandler: _PyExpat_XML_SetXmlDeclHandler,
    /** @export */ PyExpat_XML_StopParser: _PyExpat_XML_StopParser,
    /** @export */ PyExpat_XML_UseForeignDTD: _PyExpat_XML_UseForeignDTD,
    /** @export */ _PyEM_CountFuncParams,
    /** @export */ _PyEM_TrampolineCall_JavaScript,
    /** @export */ _PyEM_detect_type_reflection,
    /** @export */ _Py_CheckEmscriptenSignals_Helper,
    /** @export */ _Py_emscripten_runtime,
    /** @export */ __assert_fail: ___assert_fail,
    /** @export */ __call_sighandler: ___call_sighandler,
    /** @export */ __cxa_begin_catch: ___cxa_begin_catch,
    /** @export */ __cxa_current_primary_exception: ___cxa_current_primary_exception,
    /** @export */ __cxa_end_catch: ___cxa_end_catch,
    /** @export */ __cxa_find_matching_catch_2: ___cxa_find_matching_catch_2,
    /** @export */ __cxa_find_matching_catch_3: ___cxa_find_matching_catch_3,
    /** @export */ __cxa_find_matching_catch_4: ___cxa_find_matching_catch_4,
    /** @export */ __cxa_rethrow: ___cxa_rethrow,
    /** @export */ __cxa_rethrow_primary_exception: ___cxa_rethrow_primary_exception,
    /** @export */ __cxa_throw: ___cxa_throw,
    /** @export */ __cxa_uncaught_exceptions: ___cxa_uncaught_exceptions,
    /** @export */ __pthread_create_js: ___pthread_create_js,
    /** @export */ __resumeException: ___resumeException,
    /** @export */ _abort_js: __abort_js,
    /** @export */ _emscripten_init_main_thread_js: __emscripten_init_main_thread_js,
    /** @export */ _emscripten_lookup_name: __emscripten_lookup_name,
    /** @export */ _emscripten_notify_mailbox_postmessage: __emscripten_notify_mailbox_postmessage,
    /** @export */ _emscripten_receive_on_main_thread_js: __emscripten_receive_on_main_thread_js,
    /** @export */ _emscripten_runtime_keepalive_clear: __emscripten_runtime_keepalive_clear,
    /** @export */ _emscripten_system: __emscripten_system,
    /** @export */ _emscripten_thread_cleanup: __emscripten_thread_cleanup,
    /** @export */ _emscripten_thread_mailbox_await: __emscripten_thread_mailbox_await,
    /** @export */ _emscripten_thread_set_strongref: __emscripten_thread_set_strongref,
    /** @export */ _emscripten_throw_longjmp: __emscripten_throw_longjmp,
    /** @export */ _gmtime_js: __gmtime_js,
    /** @export */ _localtime_js: __localtime_js,
    /** @export */ _mktime_js: __mktime_js,
    /** @export */ _setitimer_js: __setitimer_js,
    /** @export */ _tzset_js: __tzset_js,
    /** @export */ _wasmfs_copy_preloaded_file_data: __wasmfs_copy_preloaded_file_data,
    /** @export */ _wasmfs_get_num_preloaded_dirs: __wasmfs_get_num_preloaded_dirs,
    /** @export */ _wasmfs_get_num_preloaded_files: __wasmfs_get_num_preloaded_files,
    /** @export */ _wasmfs_get_preloaded_child_path: __wasmfs_get_preloaded_child_path,
    /** @export */ _wasmfs_get_preloaded_file_mode: __wasmfs_get_preloaded_file_mode,
    /** @export */ _wasmfs_get_preloaded_file_size: __wasmfs_get_preloaded_file_size,
    /** @export */ _wasmfs_get_preloaded_parent_path: __wasmfs_get_preloaded_parent_path,
    /** @export */ _wasmfs_get_preloaded_path_name: __wasmfs_get_preloaded_path_name,
    /** @export */ _wasmfs_jsimpl_alloc_file: __wasmfs_jsimpl_alloc_file,
    /** @export */ _wasmfs_jsimpl_free_file: __wasmfs_jsimpl_free_file,
    /** @export */ _wasmfs_jsimpl_get_size: __wasmfs_jsimpl_get_size,
    /** @export */ _wasmfs_jsimpl_read: __wasmfs_jsimpl_read,
    /** @export */ _wasmfs_jsimpl_set_size: __wasmfs_jsimpl_set_size,
    /** @export */ _wasmfs_jsimpl_write: __wasmfs_jsimpl_write,
    /** @export */ _wasmfs_opfs_close_access: __wasmfs_opfs_close_access,
    /** @export */ _wasmfs_opfs_close_blob: __wasmfs_opfs_close_blob,
    /** @export */ _wasmfs_opfs_flush_access: __wasmfs_opfs_flush_access,
    /** @export */ _wasmfs_opfs_free_directory: __wasmfs_opfs_free_directory,
    /** @export */ _wasmfs_opfs_free_file: __wasmfs_opfs_free_file,
    /** @export */ _wasmfs_opfs_get_child: __wasmfs_opfs_get_child,
    /** @export */ _wasmfs_opfs_get_entries: __wasmfs_opfs_get_entries,
    /** @export */ _wasmfs_opfs_get_size_access: __wasmfs_opfs_get_size_access,
    /** @export */ _wasmfs_opfs_get_size_blob: __wasmfs_opfs_get_size_blob,
    /** @export */ _wasmfs_opfs_get_size_file: __wasmfs_opfs_get_size_file,
    /** @export */ _wasmfs_opfs_init_root_directory: __wasmfs_opfs_init_root_directory,
    /** @export */ _wasmfs_opfs_insert_directory: __wasmfs_opfs_insert_directory,
    /** @export */ _wasmfs_opfs_insert_file: __wasmfs_opfs_insert_file,
    /** @export */ _wasmfs_opfs_move_file: __wasmfs_opfs_move_file,
    /** @export */ _wasmfs_opfs_open_access: __wasmfs_opfs_open_access,
    /** @export */ _wasmfs_opfs_open_blob: __wasmfs_opfs_open_blob,
    /** @export */ _wasmfs_opfs_read_access: __wasmfs_opfs_read_access,
    /** @export */ _wasmfs_opfs_read_blob: __wasmfs_opfs_read_blob,
    /** @export */ _wasmfs_opfs_remove_child: __wasmfs_opfs_remove_child,
    /** @export */ _wasmfs_opfs_set_size_access: __wasmfs_opfs_set_size_access,
    /** @export */ _wasmfs_opfs_set_size_file: __wasmfs_opfs_set_size_file,
    /** @export */ _wasmfs_opfs_write_access: __wasmfs_opfs_write_access,
    /** @export */ _wasmfs_stdin_get_char: __wasmfs_stdin_get_char,
    /** @export */ _wasmfs_thread_utils_heartbeat: __wasmfs_thread_utils_heartbeat,
    /** @export */ clock_res_get: _clock_res_get,
    /** @export */ clock_time_get: _clock_time_get,
    /** @export */ emscripten_asm_const_async_on_main_thread: _emscripten_asm_const_async_on_main_thread,
    /** @export */ emscripten_asm_const_int: _emscripten_asm_const_int,
    /** @export */ emscripten_asm_const_int_sync_on_main_thread: _emscripten_asm_const_int_sync_on_main_thread,
    /** @export */ emscripten_check_blocking_allowed: _emscripten_check_blocking_allowed,
    /** @export */ emscripten_date_now: _emscripten_date_now,
    /** @export */ emscripten_err: _emscripten_err,
    /** @export */ emscripten_exit_with_live_runtime: _emscripten_exit_with_live_runtime,
    /** @export */ emscripten_get_element_css_size: _emscripten_get_element_css_size,
    /** @export */ emscripten_get_heap_max: _emscripten_get_heap_max,
    /** @export */ emscripten_get_now: _emscripten_get_now,
    /** @export */ emscripten_has_asyncify: _emscripten_has_asyncify,
    /** @export */ emscripten_num_logical_cores: _emscripten_num_logical_cores,
    /** @export */ emscripten_out: _emscripten_out,
    /** @export */ emscripten_resize_heap: _emscripten_resize_heap,
    /** @export */ emscripten_set_keydown_callback_on_thread: _emscripten_set_keydown_callback_on_thread,
    /** @export */ emscripten_set_keyup_callback_on_thread: _emscripten_set_keyup_callback_on_thread,
    /** @export */ emscripten_set_main_loop_arg: _emscripten_set_main_loop_arg,
    /** @export */ emscripten_set_mousedown_callback_on_thread: _emscripten_set_mousedown_callback_on_thread,
    /** @export */ emscripten_set_mousemove_callback_on_thread: _emscripten_set_mousemove_callback_on_thread,
    /** @export */ emscripten_set_mouseup_callback_on_thread: _emscripten_set_mouseup_callback_on_thread,
    /** @export */ emscripten_set_resize_callback_on_thread: _emscripten_set_resize_callback_on_thread,
    /** @export */ emscripten_set_wheel_callback_on_thread: _emscripten_set_wheel_callback_on_thread,
    /** @export */ emscripten_unwind_to_js_event_loop: _emscripten_unwind_to_js_event_loop,
    /** @export */ emscripten_webgpu_get_device: _emscripten_webgpu_get_device,
    /** @export */ environ_get: _environ_get,
    /** @export */ environ_sizes_get: _environ_sizes_get,
    /** @export */ exit: _exit,
    /** @export */ getaddrinfo: _getaddrinfo,
    /** @export */ getnameinfo: _getnameinfo,
    /** @export */ getprotobyname: _getprotobyname,
    /** @export */ invoke_d,
    /** @export */ invoke_di,
    /** @export */ invoke_did,
    /** @export */ invoke_didi,
    /** @export */ invoke_dii,
    /** @export */ invoke_diii,
    /** @export */ invoke_diiii,
    /** @export */ invoke_diiiid,
    /** @export */ invoke_f,
    /** @export */ invoke_ff,
    /** @export */ invoke_fff,
    /** @export */ invoke_fffff,
    /** @export */ invoke_ffi,
    /** @export */ invoke_ffii,
    /** @export */ invoke_ffiiii,
    /** @export */ invoke_fi,
    /** @export */ invoke_fid,
    /** @export */ invoke_fidf,
    /** @export */ invoke_fif,
    /** @export */ invoke_fiff,
    /** @export */ invoke_fifff,
    /** @export */ invoke_fiffff,
    /** @export */ invoke_fiffffffii,
    /** @export */ invoke_fifffii,
    /** @export */ invoke_fiffii,
    /** @export */ invoke_fifi,
    /** @export */ invoke_fii,
    /** @export */ invoke_fiif,
    /** @export */ invoke_fiiff,
    /** @export */ invoke_fiiffiii,
    /** @export */ invoke_fiifi,
    /** @export */ invoke_fiifii,
    /** @export */ invoke_fiii,
    /** @export */ invoke_fiiiff,
    /** @export */ invoke_fiiifff,
    /** @export */ invoke_fiiiffi,
    /** @export */ invoke_fiiifiii,
    /** @export */ invoke_fiiii,
    /** @export */ invoke_fiiiif,
    /** @export */ invoke_fiiiii,
    /** @export */ invoke_fiiiiii,
    /** @export */ invoke_fiiiiiii,
    /** @export */ invoke_fij,
    /** @export */ invoke_fijii,
    /** @export */ invoke_fijjj,
    /** @export */ invoke_i,
    /** @export */ invoke_id,
    /** @export */ invoke_idiiii,
    /** @export */ invoke_if,
    /** @export */ invoke_ifff,
    /** @export */ invoke_ifffiiiii,
    /** @export */ invoke_iffi,
    /** @export */ invoke_ifiii,
    /** @export */ invoke_ifiiiiffffffii,
    /** @export */ invoke_ii,
    /** @export */ invoke_iid,
    /** @export */ invoke_iidddd,
    /** @export */ invoke_iiddddddd,
    /** @export */ invoke_iiddi,
    /** @export */ invoke_iiddii,
    /** @export */ invoke_iidi,
    /** @export */ invoke_iidiiii,
    /** @export */ invoke_iidiiiii,
    /** @export */ invoke_iif,
    /** @export */ invoke_iiff,
    /** @export */ invoke_iiffffff,
    /** @export */ invoke_iiffffffffi,
    /** @export */ invoke_iiffi,
    /** @export */ invoke_iiffii,
    /** @export */ invoke_iiffiii,
    /** @export */ invoke_iifi,
    /** @export */ invoke_iifii,
    /** @export */ invoke_iifiiiii,
    /** @export */ invoke_iii,
    /** @export */ invoke_iiid,
    /** @export */ invoke_iiiddddddd,
    /** @export */ invoke_iiidi,
    /** @export */ invoke_iiidii,
    /** @export */ invoke_iiidiiiii,
    /** @export */ invoke_iiif,
    /** @export */ invoke_iiiff,
    /** @export */ invoke_iiifff,
    /** @export */ invoke_iiifffii,
    /** @export */ invoke_iiiffi,
    /** @export */ invoke_iiifii,
    /** @export */ invoke_iiifiiffii,
    /** @export */ invoke_iiifiii,
    /** @export */ invoke_iiii,
    /** @export */ invoke_iiiid,
    /** @export */ invoke_iiiidd,
    /** @export */ invoke_iiiiddi,
    /** @export */ invoke_iiiidi,
    /** @export */ invoke_iiiidid,
    /** @export */ invoke_iiiidii,
    /** @export */ invoke_iiiidiii,
    /** @export */ invoke_iiiif,
    /** @export */ invoke_iiiiff,
    /** @export */ invoke_iiiiffii,
    /** @export */ invoke_iiiifi,
    /** @export */ invoke_iiiififii,
    /** @export */ invoke_iiiifii,
    /** @export */ invoke_iiiifiii,
    /** @export */ invoke_iiiifiiifiiiii,
    /** @export */ invoke_iiiifiiiiiiii,
    /** @export */ invoke_iiiii,
    /** @export */ invoke_iiiiid,
    /** @export */ invoke_iiiiif,
    /** @export */ invoke_iiiiiffff,
    /** @export */ invoke_iiiiiffiifii,
    /** @export */ invoke_iiiiiffiii,
    /** @export */ invoke_iiiiifi,
    /** @export */ invoke_iiiiifiii,
    /** @export */ invoke_iiiiifiiiiiii,
    /** @export */ invoke_iiiiii,
    /** @export */ invoke_iiiiiif,
    /** @export */ invoke_iiiiiifi,
    /** @export */ invoke_iiiiiifiifi,
    /** @export */ invoke_iiiiiii,
    /** @export */ invoke_iiiiiiif,
    /** @export */ invoke_iiiiiiifffi,
    /** @export */ invoke_iiiiiiifi,
    /** @export */ invoke_iiiiiiifii,
    /** @export */ invoke_iiiiiiii,
    /** @export */ invoke_iiiiiiiidii,
    /** @export */ invoke_iiiiiiiifi,
    /** @export */ invoke_iiiiiiiii,
    /** @export */ invoke_iiiiiiiiid,
    /** @export */ invoke_iiiiiiiiidii,
    /** @export */ invoke_iiiiiiiiiffi,
    /** @export */ invoke_iiiiiiiiifi,
    /** @export */ invoke_iiiiiiiiifiiiiii,
    /** @export */ invoke_iiiiiiiiii,
    /** @export */ invoke_iiiiiiiiiif,
    /** @export */ invoke_iiiiiiiiiii,
    /** @export */ invoke_iiiiiiiiiiiffi,
    /** @export */ invoke_iiiiiiiiiiii,
    /** @export */ invoke_iiiiiiiiiiiif,
    /** @export */ invoke_iiiiiiiiiiiifffiiifiii,
    /** @export */ invoke_iiiiiiiiiiiiffi,
    /** @export */ invoke_iiiiiiiiiiiii,
    /** @export */ invoke_iiiiiiiiiiiiii,
    /** @export */ invoke_iiiiiiiiiiiiiii,
    /** @export */ invoke_iiiiiiiiiiiiiiii,
    /** @export */ invoke_iiiiiiiiiiiiiiiiiii,
    /** @export */ invoke_iiiiiiiiiiiiiiiiiiiiiii,
    /** @export */ invoke_iiiiiiiiiiiiiiiijjjii,
    /** @export */ invoke_iiiiiiiiiiiiiiijjjii,
    /** @export */ invoke_iiiiiiiiiiiiiijjj,
    /** @export */ invoke_iiiiiiiiiiiiijj,
    /** @export */ invoke_iiiiiiiiiiiijjj,
    /** @export */ invoke_iiiiiiiiiiijj,
    /** @export */ invoke_iiiiiiiiiijjj,
    /** @export */ invoke_iiiiiiiiiijjjiiiii,
    /** @export */ invoke_iiiiiiiijjjii,
    /** @export */ invoke_iiiiiiij,
    /** @export */ invoke_iiiiiiijj,
    /** @export */ invoke_iiiiiiijjj,
    /** @export */ invoke_iiiiiiijjjiijjj,
    /** @export */ invoke_iiiiiiijjjiijjji,
    /** @export */ invoke_iiiiiij,
    /** @export */ invoke_iiiiiijjj,
    /** @export */ invoke_iiiiiijjjjijjj,
    /** @export */ invoke_iiiiij,
    /** @export */ invoke_iiiiiji,
    /** @export */ invoke_iiiiijiii,
    /** @export */ invoke_iiiiijjj,
    /** @export */ invoke_iiiiijjji,
    /** @export */ invoke_iiiij,
    /** @export */ invoke_iiiiji,
    /** @export */ invoke_iiiijiiii,
    /** @export */ invoke_iiiijjj,
    /** @export */ invoke_iiiijjjii,
    /** @export */ invoke_iiij,
    /** @export */ invoke_iiiji,
    /** @export */ invoke_iiijii,
    /** @export */ invoke_iiijiii,
    /** @export */ invoke_iij,
    /** @export */ invoke_iiji,
    /** @export */ invoke_iijii,
    /** @export */ invoke_iijiii,
    /** @export */ invoke_iijj,
    /** @export */ invoke_iijji,
    /** @export */ invoke_iijjiii,
    /** @export */ invoke_ij,
    /** @export */ invoke_ijiiii,
    /** @export */ invoke_ijjiiii,
    /** @export */ invoke_j,
    /** @export */ invoke_ji,
    /** @export */ invoke_jifii,
    /** @export */ invoke_jii,
    /** @export */ invoke_jiii,
    /** @export */ invoke_jiiii,
    /** @export */ invoke_jiij,
    /** @export */ invoke_jiijj,
    /** @export */ invoke_jij,
    /** @export */ invoke_jiji,
    /** @export */ invoke_jjj,
    /** @export */ invoke_v,
    /** @export */ invoke_vdd,
    /** @export */ invoke_vdii,
    /** @export */ invoke_vf,
    /** @export */ invoke_vff,
    /** @export */ invoke_vfff,
    /** @export */ invoke_vffff,
    /** @export */ invoke_vffffffi,
    /** @export */ invoke_vffffiii,
    /** @export */ invoke_vfffii,
    /** @export */ invoke_vfffiii,
    /** @export */ invoke_vfffiiii,
    /** @export */ invoke_vffi,
    /** @export */ invoke_vffiffi,
    /** @export */ invoke_vfii,
    /** @export */ invoke_vfiii,
    /** @export */ invoke_vfiiifiiiii,
    /** @export */ invoke_vi,
    /** @export */ invoke_vid,
    /** @export */ invoke_vidd,
    /** @export */ invoke_viddd,
    /** @export */ invoke_viddddi,
    /** @export */ invoke_vidddi,
    /** @export */ invoke_vidi,
    /** @export */ invoke_vididddd,
    /** @export */ invoke_vidiii,
    /** @export */ invoke_vif,
    /** @export */ invoke_vifdi,
    /** @export */ invoke_viff,
    /** @export */ invoke_vifff,
    /** @export */ invoke_viffff,
    /** @export */ invoke_viffffff,
    /** @export */ invoke_viffffffffiiii,
    /** @export */ invoke_viffffi,
    /** @export */ invoke_viffffii,
    /** @export */ invoke_vifffi,
    /** @export */ invoke_viffi,
    /** @export */ invoke_viffii,
    /** @export */ invoke_viffiii,
    /** @export */ invoke_viffiiiiiffi,
    /** @export */ invoke_vifi,
    /** @export */ invoke_vififiif,
    /** @export */ invoke_vifii,
    /** @export */ invoke_vifiii,
    /** @export */ invoke_vifiiifiiiiiiiiiiiiifiiii,
    /** @export */ invoke_vifiiii,
    /** @export */ invoke_vifiiiii,
    /** @export */ invoke_vifiiiiii,
    /** @export */ invoke_vii,
    /** @export */ invoke_viid,
    /** @export */ invoke_viiddd,
    /** @export */ invoke_viidddd,
    /** @export */ invoke_viidi,
    /** @export */ invoke_viidiiiiii,
    /** @export */ invoke_viif,
    /** @export */ invoke_viiff,
    /** @export */ invoke_viifff,
    /** @export */ invoke_viiffff,
    /** @export */ invoke_viifffi,
    /** @export */ invoke_viifffiiii,
    /** @export */ invoke_viiffi,
    /** @export */ invoke_viiffifi,
    /** @export */ invoke_viiffii,
    /** @export */ invoke_viiffiiii,
    /** @export */ invoke_viiffiiiii,
    /** @export */ invoke_viiffiiiiii,
    /** @export */ invoke_viiffiiiiiifi,
    /** @export */ invoke_viifi,
    /** @export */ invoke_viififf,
    /** @export */ invoke_viifii,
    /** @export */ invoke_viifiiffiiiiiii,
    /** @export */ invoke_viifiii,
    /** @export */ invoke_viifiiii,
    /** @export */ invoke_viifiiiiii,
    /** @export */ invoke_viii,
    /** @export */ invoke_viiid,
    /** @export */ invoke_viiidf,
    /** @export */ invoke_viiidii,
    /** @export */ invoke_viiidiiiiiii,
    /** @export */ invoke_viiif,
    /** @export */ invoke_viiiff,
    /** @export */ invoke_viiiffff,
    /** @export */ invoke_viiiffffif,
    /** @export */ invoke_viiifffi,
    /** @export */ invoke_viiiffi,
    /** @export */ invoke_viiiffii,
    /** @export */ invoke_viiiffiiii,
    /** @export */ invoke_viiifi,
    /** @export */ invoke_viiifif,
    /** @export */ invoke_viiififf,
    /** @export */ invoke_viiififii,
    /** @export */ invoke_viiifii,
    /** @export */ invoke_viiifiiiii,
    /** @export */ invoke_viiifiiiiii,
    /** @export */ invoke_viiifiiiiiiiiii,
    /** @export */ invoke_viiii,
    /** @export */ invoke_viiiid,
    /** @export */ invoke_viiiidii,
    /** @export */ invoke_viiiif,
    /** @export */ invoke_viiiiff,
    /** @export */ invoke_viiiifff,
    /** @export */ invoke_viiiifffff,
    /** @export */ invoke_viiiifffiii,
    /** @export */ invoke_viiiiffii,
    /** @export */ invoke_viiiiffiiii,
    /** @export */ invoke_viiiifi,
    /** @export */ invoke_viiiififi,
    /** @export */ invoke_viiiifii,
    /** @export */ invoke_viiiifiiii,
    /** @export */ invoke_viiiii,
    /** @export */ invoke_viiiiif,
    /** @export */ invoke_viiiiiffffi,
    /** @export */ invoke_viiiiiffi,
    /** @export */ invoke_viiiiifi,
    /** @export */ invoke_viiiiififffiii,
    /** @export */ invoke_viiiiifii,
    /** @export */ invoke_viiiiifiii,
    /** @export */ invoke_viiiiifiiiii,
    /** @export */ invoke_viiiiii,
    /** @export */ invoke_viiiiiid,
    /** @export */ invoke_viiiiiif,
    /** @export */ invoke_viiiiiifffiiifii,
    /** @export */ invoke_viiiiiifi,
    /** @export */ invoke_viiiiiifif,
    /** @export */ invoke_viiiiiifii,
    /** @export */ invoke_viiiiiifiii,
    /** @export */ invoke_viiiiiifiiiiiiiiii,
    /** @export */ invoke_viiiiiii,
    /** @export */ invoke_viiiiiiidiiii,
    /** @export */ invoke_viiiiiiif,
    /** @export */ invoke_viiiiiiifffiiii,
    /** @export */ invoke_viiiiiiifi,
    /** @export */ invoke_viiiiiiifiiii,
    /** @export */ invoke_viiiiiiii,
    /** @export */ invoke_viiiiiiiif,
    /** @export */ invoke_viiiiiiiifi,
    /** @export */ invoke_viiiiiiiii,
    /** @export */ invoke_viiiiiiiiif,
    /** @export */ invoke_viiiiiiiiifi,
    /** @export */ invoke_viiiiiiiiifii,
    /** @export */ invoke_viiiiiiiiifiiii,
    /** @export */ invoke_viiiiiiiiii,
    /** @export */ invoke_viiiiiiiiiidii,
    /** @export */ invoke_viiiiiiiiiif,
    /** @export */ invoke_viiiiiiiiiififii,
    /** @export */ invoke_viiiiiiiiiii,
    /** @export */ invoke_viiiiiiiiiiiff,
    /** @export */ invoke_viiiiiiiiiiii,
    /** @export */ invoke_viiiiiiiiiiiii,
    /** @export */ invoke_viiiiiiiiiiiiii,
    /** @export */ invoke_viiiiiiiiiiiiiii,
    /** @export */ invoke_viiiiiiiiiiiiiiii,
    /** @export */ invoke_viiiiiiiiiiiiiiiii,
    /** @export */ invoke_viiiiiiiiiijj,
    /** @export */ invoke_viiiiiijjij,
    /** @export */ invoke_viiiiij,
    /** @export */ invoke_viiiiiji,
    /** @export */ invoke_viiiiijjj,
    /** @export */ invoke_viiiiijjjfiiiiiii,
    /** @export */ invoke_viiiij,
    /** @export */ invoke_viiiiji,
    /** @export */ invoke_viiiijii,
    /** @export */ invoke_viiiijjij,
    /** @export */ invoke_viiij,
    /** @export */ invoke_viiiji,
    /** @export */ invoke_viiijii,
    /** @export */ invoke_viiijiii,
    /** @export */ invoke_viiijj,
    /** @export */ invoke_viij,
    /** @export */ invoke_viiji,
    /** @export */ invoke_viijii,
    /** @export */ invoke_viijiiii,
    /** @export */ invoke_viijiji,
    /** @export */ invoke_viijj,
    /** @export */ invoke_vij,
    /** @export */ invoke_vijf,
    /** @export */ invoke_viji,
    /** @export */ invoke_vijif,
    /** @export */ invoke_vijifi,
    /** @export */ invoke_vijii,
    /** @export */ invoke_vijiif,
    /** @export */ invoke_vijiii,
    /** @export */ invoke_vijj,
    /** @export */ invoke_vj,
    /** @export */ invoke_vji,
    /** @export */ invoke_vjjii,
    /** @export */ invoke_vjjjii,
    /** @export */ invoke_vjjjjii,
    /** @export */ invoke_vjjjjjjii,
    /** @export */ llvm_eh_typeid_for: _llvm_eh_typeid_for,
    /** @export */ memory: wasmMemory,
    /** @export */ proc_exit: _proc_exit,
    /** @export */ random_get: _random_get,
    /** @export */ sqlite3_aggregate_context: _sqlite3_aggregate_context,
    /** @export */ sqlite3_backup_finish: _sqlite3_backup_finish,
    /** @export */ sqlite3_backup_init: _sqlite3_backup_init,
    /** @export */ sqlite3_backup_pagecount: _sqlite3_backup_pagecount,
    /** @export */ sqlite3_backup_remaining: _sqlite3_backup_remaining,
    /** @export */ sqlite3_backup_step: _sqlite3_backup_step,
    /** @export */ sqlite3_bind_blob: _sqlite3_bind_blob,
    /** @export */ sqlite3_bind_double: _sqlite3_bind_double,
    /** @export */ sqlite3_bind_int64: _sqlite3_bind_int64,
    /** @export */ sqlite3_bind_null: _sqlite3_bind_null,
    /** @export */ sqlite3_bind_parameter_count: _sqlite3_bind_parameter_count,
    /** @export */ sqlite3_bind_parameter_name: _sqlite3_bind_parameter_name,
    /** @export */ sqlite3_bind_text: _sqlite3_bind_text,
    /** @export */ sqlite3_blob_bytes: _sqlite3_blob_bytes,
    /** @export */ sqlite3_blob_close: _sqlite3_blob_close,
    /** @export */ sqlite3_blob_open: _sqlite3_blob_open,
    /** @export */ sqlite3_blob_read: _sqlite3_blob_read,
    /** @export */ sqlite3_blob_write: _sqlite3_blob_write,
    /** @export */ sqlite3_busy_timeout: _sqlite3_busy_timeout,
    /** @export */ sqlite3_changes: _sqlite3_changes,
    /** @export */ sqlite3_close: _sqlite3_close,
    /** @export */ sqlite3_close_v2: _sqlite3_close_v2,
    /** @export */ sqlite3_column_blob: _sqlite3_column_blob,
    /** @export */ sqlite3_column_bytes: _sqlite3_column_bytes,
    /** @export */ sqlite3_column_count: _sqlite3_column_count,
    /** @export */ sqlite3_column_decltype: _sqlite3_column_decltype,
    /** @export */ sqlite3_column_double: _sqlite3_column_double,
    /** @export */ sqlite3_column_int64: _sqlite3_column_int64,
    /** @export */ sqlite3_column_name: _sqlite3_column_name,
    /** @export */ sqlite3_column_text: _sqlite3_column_text,
    /** @export */ sqlite3_column_type: _sqlite3_column_type,
    /** @export */ sqlite3_complete: _sqlite3_complete,
    /** @export */ sqlite3_context_db_handle: _sqlite3_context_db_handle,
    /** @export */ sqlite3_create_collation_v2: _sqlite3_create_collation_v2,
    /** @export */ sqlite3_create_function_v2: _sqlite3_create_function_v2,
    /** @export */ sqlite3_create_window_function: _sqlite3_create_window_function,
    /** @export */ sqlite3_data_count: _sqlite3_data_count,
    /** @export */ sqlite3_db_config: _sqlite3_db_config,
    /** @export */ sqlite3_db_handle: _sqlite3_db_handle,
    /** @export */ sqlite3_deserialize: _sqlite3_deserialize,
    /** @export */ sqlite3_errcode: _sqlite3_errcode,
    /** @export */ sqlite3_errmsg: _sqlite3_errmsg,
    /** @export */ sqlite3_errstr: _sqlite3_errstr,
    /** @export */ sqlite3_exec: _sqlite3_exec,
    /** @export */ sqlite3_expanded_sql: _sqlite3_expanded_sql,
    /** @export */ sqlite3_extended_errcode: _sqlite3_extended_errcode,
    /** @export */ sqlite3_finalize: _sqlite3_finalize,
    /** @export */ sqlite3_free: _sqlite3_free,
    /** @export */ sqlite3_get_autocommit: _sqlite3_get_autocommit,
    /** @export */ sqlite3_initialize: _sqlite3_initialize,
    /** @export */ sqlite3_interrupt: _sqlite3_interrupt,
    /** @export */ sqlite3_last_insert_rowid: _sqlite3_last_insert_rowid,
    /** @export */ sqlite3_libversion: _sqlite3_libversion,
    /** @export */ sqlite3_libversion_number: _sqlite3_libversion_number,
    /** @export */ sqlite3_limit: _sqlite3_limit,
    /** @export */ sqlite3_malloc64: _sqlite3_malloc64,
    /** @export */ sqlite3_open_v2: _sqlite3_open_v2,
    /** @export */ sqlite3_prepare_v2: _sqlite3_prepare_v2,
    /** @export */ sqlite3_progress_handler: _sqlite3_progress_handler,
    /** @export */ sqlite3_reset: _sqlite3_reset,
    /** @export */ sqlite3_result_blob: _sqlite3_result_blob,
    /** @export */ sqlite3_result_double: _sqlite3_result_double,
    /** @export */ sqlite3_result_error: _sqlite3_result_error,
    /** @export */ sqlite3_result_error_nomem: _sqlite3_result_error_nomem,
    /** @export */ sqlite3_result_error_toobig: _sqlite3_result_error_toobig,
    /** @export */ sqlite3_result_int64: _sqlite3_result_int64,
    /** @export */ sqlite3_result_null: _sqlite3_result_null,
    /** @export */ sqlite3_result_text: _sqlite3_result_text,
    /** @export */ sqlite3_serialize: _sqlite3_serialize,
    /** @export */ sqlite3_set_authorizer: _sqlite3_set_authorizer,
    /** @export */ sqlite3_sleep: _sqlite3_sleep,
    /** @export */ sqlite3_step: _sqlite3_step,
    /** @export */ sqlite3_stmt_busy: _sqlite3_stmt_busy,
    /** @export */ sqlite3_stmt_readonly: _sqlite3_stmt_readonly,
    /** @export */ sqlite3_stricmp: _sqlite3_stricmp,
    /** @export */ sqlite3_threadsafe: _sqlite3_threadsafe,
    /** @export */ sqlite3_total_changes: _sqlite3_total_changes,
    /** @export */ sqlite3_trace_v2: _sqlite3_trace_v2,
    /** @export */ sqlite3_user_data: _sqlite3_user_data,
    /** @export */ sqlite3_value_blob: _sqlite3_value_blob,
    /** @export */ sqlite3_value_bytes: _sqlite3_value_bytes,
    /** @export */ sqlite3_value_double: _sqlite3_value_double,
    /** @export */ sqlite3_value_int64: _sqlite3_value_int64,
    /** @export */ sqlite3_value_text: _sqlite3_value_text,
    /** @export */ sqlite3_value_type: _sqlite3_value_type,
    /** @export */ wasmfs_create_provider_backend: _wasmfs_create_provider_backend,
    /** @export */ wgpuBindGroupAddRef: _wgpuBindGroupAddRef,
    /** @export */ wgpuBindGroupLayoutRelease: _wgpuBindGroupLayoutRelease,
    /** @export */ wgpuBindGroupRelease: _wgpuBindGroupRelease,
    /** @export */ wgpuBufferAddRef: _wgpuBufferAddRef,
    /** @export */ wgpuBufferGetConstMappedRange: _wgpuBufferGetConstMappedRange,
    /** @export */ wgpuBufferGetMappedRange: _wgpuBufferGetMappedRange,
    /** @export */ wgpuBufferGetSize: _wgpuBufferGetSize,
    /** @export */ wgpuBufferGetUsage: _wgpuBufferGetUsage,
    /** @export */ wgpuBufferMapAsync: _wgpuBufferMapAsync,
    /** @export */ wgpuBufferRelease: _wgpuBufferRelease,
    /** @export */ wgpuBufferUnmap: _wgpuBufferUnmap,
    /** @export */ wgpuCommandBufferRelease: _wgpuCommandBufferRelease,
    /** @export */ wgpuCommandEncoderBeginComputePass: _wgpuCommandEncoderBeginComputePass,
    /** @export */ wgpuCommandEncoderBeginRenderPass: _wgpuCommandEncoderBeginRenderPass,
    /** @export */ wgpuCommandEncoderCopyBufferToBuffer: _wgpuCommandEncoderCopyBufferToBuffer,
    /** @export */ wgpuCommandEncoderCopyTextureToBuffer: _wgpuCommandEncoderCopyTextureToBuffer,
    /** @export */ wgpuCommandEncoderCopyTextureToTexture: _wgpuCommandEncoderCopyTextureToTexture,
    /** @export */ wgpuCommandEncoderFinish: _wgpuCommandEncoderFinish,
    /** @export */ wgpuCommandEncoderRelease: _wgpuCommandEncoderRelease,
    /** @export */ wgpuCommandEncoderResolveQuerySet: _wgpuCommandEncoderResolveQuerySet,
    /** @export */ wgpuComputePassEncoderDispatchWorkgroups: _wgpuComputePassEncoderDispatchWorkgroups,
    /** @export */ wgpuComputePassEncoderDispatchWorkgroupsIndirect: _wgpuComputePassEncoderDispatchWorkgroupsIndirect,
    /** @export */ wgpuComputePassEncoderEnd: _wgpuComputePassEncoderEnd,
    /** @export */ wgpuComputePassEncoderRelease: _wgpuComputePassEncoderRelease,
    /** @export */ wgpuComputePassEncoderSetBindGroup: _wgpuComputePassEncoderSetBindGroup,
    /** @export */ wgpuComputePassEncoderSetPipeline: _wgpuComputePassEncoderSetPipeline,
    /** @export */ wgpuComputePipelineGetBindGroupLayout: _wgpuComputePipelineGetBindGroupLayout,
    /** @export */ wgpuComputePipelineRelease: _wgpuComputePipelineRelease,
    /** @export */ wgpuCreateInstance: _wgpuCreateInstance,
    /** @export */ wgpuDeviceCreateBindGroup: _wgpuDeviceCreateBindGroup,
    /** @export */ wgpuDeviceCreateBindGroupLayout: _wgpuDeviceCreateBindGroupLayout,
    /** @export */ wgpuDeviceCreateBuffer: _wgpuDeviceCreateBuffer,
    /** @export */ wgpuDeviceCreateCommandEncoder: _wgpuDeviceCreateCommandEncoder,
    /** @export */ wgpuDeviceCreateComputePipeline: _wgpuDeviceCreateComputePipeline,
    /** @export */ wgpuDeviceCreatePipelineLayout: _wgpuDeviceCreatePipelineLayout,
    /** @export */ wgpuDeviceCreateQuerySet: _wgpuDeviceCreateQuerySet,
    /** @export */ wgpuDeviceCreateRenderPipeline: _wgpuDeviceCreateRenderPipeline,
    /** @export */ wgpuDeviceCreateSampler: _wgpuDeviceCreateSampler,
    /** @export */ wgpuDeviceCreateShaderModule: _wgpuDeviceCreateShaderModule,
    /** @export */ wgpuDeviceCreateTexture: _wgpuDeviceCreateTexture,
    /** @export */ wgpuDeviceGetQueue: _wgpuDeviceGetQueue,
    /** @export */ wgpuDeviceHasFeature: _wgpuDeviceHasFeature,
    /** @export */ wgpuInstanceCreateSurface: _wgpuInstanceCreateSurface,
    /** @export */ wgpuInstanceRelease: _wgpuInstanceRelease,
    /** @export */ wgpuInstanceWaitAny: _wgpuInstanceWaitAny,
    /** @export */ wgpuPipelineLayoutRelease: _wgpuPipelineLayoutRelease,
    /** @export */ wgpuQuerySetRelease: _wgpuQuerySetRelease,
    /** @export */ wgpuQueueRelease: _wgpuQueueRelease,
    /** @export */ wgpuQueueSubmit: _wgpuQueueSubmit,
    /** @export */ wgpuQueueWriteBuffer: _wgpuQueueWriteBuffer,
    /** @export */ wgpuQueueWriteTexture: _wgpuQueueWriteTexture,
    /** @export */ wgpuRenderPassEncoderBeginOcclusionQuery: _wgpuRenderPassEncoderBeginOcclusionQuery,
    /** @export */ wgpuRenderPassEncoderDraw: _wgpuRenderPassEncoderDraw,
    /** @export */ wgpuRenderPassEncoderDrawIndexed: _wgpuRenderPassEncoderDrawIndexed,
    /** @export */ wgpuRenderPassEncoderDrawIndexedIndirect: _wgpuRenderPassEncoderDrawIndexedIndirect,
    /** @export */ wgpuRenderPassEncoderDrawIndirect: _wgpuRenderPassEncoderDrawIndirect,
    /** @export */ wgpuRenderPassEncoderEnd: _wgpuRenderPassEncoderEnd,
    /** @export */ wgpuRenderPassEncoderEndOcclusionQuery: _wgpuRenderPassEncoderEndOcclusionQuery,
    /** @export */ wgpuRenderPassEncoderRelease: _wgpuRenderPassEncoderRelease,
    /** @export */ wgpuRenderPassEncoderSetBindGroup: _wgpuRenderPassEncoderSetBindGroup,
    /** @export */ wgpuRenderPassEncoderSetIndexBuffer: _wgpuRenderPassEncoderSetIndexBuffer,
    /** @export */ wgpuRenderPassEncoderSetPipeline: _wgpuRenderPassEncoderSetPipeline,
    /** @export */ wgpuRenderPassEncoderSetScissorRect: _wgpuRenderPassEncoderSetScissorRect,
    /** @export */ wgpuRenderPassEncoderSetStencilReference: _wgpuRenderPassEncoderSetStencilReference,
    /** @export */ wgpuRenderPassEncoderSetVertexBuffer: _wgpuRenderPassEncoderSetVertexBuffer,
    /** @export */ wgpuRenderPassEncoderSetViewport: _wgpuRenderPassEncoderSetViewport,
    /** @export */ wgpuRenderPipelineGetBindGroupLayout: _wgpuRenderPipelineGetBindGroupLayout,
    /** @export */ wgpuRenderPipelineRelease: _wgpuRenderPipelineRelease,
    /** @export */ wgpuSamplerAddRef: _wgpuSamplerAddRef,
    /** @export */ wgpuSamplerRelease: _wgpuSamplerRelease,
    /** @export */ wgpuShaderModuleRelease: _wgpuShaderModuleRelease,
    /** @export */ wgpuSurfaceConfigure: _wgpuSurfaceConfigure,
    /** @export */ wgpuSurfaceGetCurrentTexture: _wgpuSurfaceGetCurrentTexture,
    /** @export */ wgpuTextureAddRef: _wgpuTextureAddRef,
    /** @export */ wgpuTextureCreateView: _wgpuTextureCreateView,
    /** @export */ wgpuTextureGetDepthOrArrayLayers: _wgpuTextureGetDepthOrArrayLayers,
    /** @export */ wgpuTextureGetDimension: _wgpuTextureGetDimension,
    /** @export */ wgpuTextureGetFormat: _wgpuTextureGetFormat,
    /** @export */ wgpuTextureGetHeight: _wgpuTextureGetHeight,
    /** @export */ wgpuTextureGetMipLevelCount: _wgpuTextureGetMipLevelCount,
    /** @export */ wgpuTextureGetUsage: _wgpuTextureGetUsage,
    /** @export */ wgpuTextureGetWidth: _wgpuTextureGetWidth,
    /** @export */ wgpuTextureRelease: _wgpuTextureRelease,
    /** @export */ wgpuTextureViewAddRef: _wgpuTextureViewAddRef,
    /** @export */ wgpuTextureViewRelease: _wgpuTextureViewRelease,
    /** @export */ wgpu_wgsl_cache_fetch,
    /** @export */ wgpu_wgsl_cache_put,
    /** @export */ wgpu_wgsl_cache_query
  };
}

function invoke_ii(index, a1) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiii(index, a1, a2, a3) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_i(index) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)();
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiii(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viii(index, a1, a2, a3) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vi(index, a1) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiii(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_v(index) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)();
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vij(index, a1, a2) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iii(index, a1, a2) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vijii(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vii(index, a1, a2) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiii(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiii(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiji(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiii(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiii(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiji(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viji(index, a1, a2, a3) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiif(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_ij(index, a1) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiifiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiifiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiffiiii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiiiifiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiffiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiffiiiiiifi(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiffiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiii(index, a1, a2, a3, a4, a5, a6, a7) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiifiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viij(index, a1, a2, a3) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiij(index, a1, a2, a3) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iijj(index, a1, a2, a3) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiji(index, a1, a2, a3, a4, a5, a6, a7) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vijj(index, a1, a2, a3) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viijj(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iij(index, a1, a2) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiij(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viifiii(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vijif(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iijji(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiif(index, a1, a2, a3) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_fij(index, a1, a2) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiif(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_fiiii(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_fiii(index, a1, a2, a3) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iifi(index, a1, a2, a3) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_fi(index, a1) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_fif(index, a1, a2) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viif(index, a1, a2, a3) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiifii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiifiii(index, a1, a2, a3, a4, a5, a6, a7) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiifi(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_fii(index, a1, a2) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiji(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_j(index) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)();
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
    return 0n;
  }
}

function invoke_iiiiiiii(index, a1, a2, a3, a4, a5, a6, a7) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_d(index) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)();
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiji(index, a1, a2, a3) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiij(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_fifff(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viijii(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiji(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiifi(index, a1, a2, a3, a4, a5, a6, a7, a8) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiifi(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_fiiiiiii(index, a1, a2, a3, a4, a5, a6, a7) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiij(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiifii(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiij(index, a1, a2, a3, a4, a5, a6, a7) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiifi(index, a1, a2, a3, a4, a5, a6, a7) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vid(index, a1, a2) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiij(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiji(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vidi(index, a1, a2, a3) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vifi(index, a1, a2, a3) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiif(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiff(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiff(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iif(index, a1, a2) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiiiiffi(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiffiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vif(index, a1, a2) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iifiiiii(index, a1, a2, a3, a4, a5, a6, a7) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiifif(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viijiji(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_ijiiii(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiij(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiidii(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiid(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_jiji(index, a1, a2, a3) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
    return 0n;
  }
}

function invoke_jiii(index, a1, a2, a3) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
    return 0n;
  }
}

function invoke_iiijii(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiijiii(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viifi(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiiiif(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iifii(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_fiiiiii(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiif(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiij(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiijii(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_ji(index, a1) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
    return 0n;
  }
}

function invoke_jii(index, a1, a2) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
    return 0n;
  }
}

function invoke_iiiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiijj(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiid(index, a1, a2, a3) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiifff(index, a1, a2, a3, a4, a5, a6, a7) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viffff(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_fiif(index, a1, a2, a3) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiifi(index, a1, a2, a3, a4, a5, a6, a7) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vifiiiii(index, a1, a2, a3, a4, a5, a6, a7) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiffii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vifiiii(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiifii(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_di(index, a1) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viifffiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viffii(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viff(index, a1, a2, a3) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vifff(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vffff(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vj(index, a1) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viffiiiiiffi(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iid(index, a1, a2) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_fifi(index, a1, a2, a3) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiijiii(index, a1, a2, a3, a4, a5, a6, a7) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiif(index, a1, a2, a3, a4, a5, a6, a7) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vf(index, a1) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiiifffiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiiiiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16, a17, a18) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16, a17, a18);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viffffff(index, a1, a2, a3, a4, a5, a6, a7) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_fiff(index, a1, a2, a3) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viifii(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiddddddd(index, a1, a2, a3, a4, a5, a6, a7, a8) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiidd(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiddi(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiddi(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viid(index, a1, a2, a3) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iidddd(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viifff(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_ff(index, a1) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiddd(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vidd(index, a1, a2, a3) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viidi(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_diii(index, a1, a2, a3) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viddddi(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiidi(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viddd(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viidddd(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iidiiii(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iidi(index, a1, a2, a3) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viffi(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiffff(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_dii(index, a1, a2) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vifii(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iidiiiii(index, a1, a2, a3, a4, a5, a6, a7) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_id(index, a1) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vididddd(index, a1, a2, a3, a4, a5, a6, a7) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vifiiifiiiiiiiiiiiiifiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16, a17, a18, a19, a20, a21, a22, a23, a24) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16, a17, a18, a19, a20, a21, a22, a23, a24);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiiiiiiif(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiifiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiiifiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiifffi(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_fiiiii(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vfiiifiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiififffiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiifii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viifffi(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiffffi(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiifiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiffi(index, a1, a2, a3, a4, a5, a6, a7, a8) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiff(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_fiifi(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiijii(index, a1, a2, a3, a4, a5, a6, a7) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vijf(index, a1, a2, a3) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiiiiiif(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vidddi(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiiijjjii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiijjj(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiififii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiiidii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vfffiiii(index, a1, a2, a3, a4, a5, a6, a7) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiffff(index, a1, a2, a3, a4, a5, a6, a7) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiffff(index, a1, a2, a3, a4, a5, a6, a7, a8) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiifiifi(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiif(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiifiii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiiiiiiiiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16, a17, a18, a19, a20, a21, a22) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16, a17, a18, a19, a20, a21, a22);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vdd(index, a1, a2) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiidii(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_diiii(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiffffff(index, a1, a2, a3, a4, a5, a6, a7) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiddii(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiff(index, a1, a2, a3) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiddddddd(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiffiii(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_didi(index, a1, a2, a3) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiifii(index, a1, a2, a3, a4, a5, a6, a7) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiif(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiidid(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiid(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiid(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiidii(index, a1, a2, a3, a4, a5, a6, a7) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiiiid(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiidiii(index, a1, a2, a3, a4, a5, a6, a7) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiidii(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiidiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiid(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_did(index, a1, a2) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viidiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiiiiiiffi(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiffi(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_if(index, a1) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_fiffii(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_fiiiffi(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiffii(index, a1, a2, a3, a4, a5, a6, a7) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_fid(index, a1, a2) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vifdi(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiifiiffii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiifffiiifii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viifiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_ifffiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiffi(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiifffff(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_fiffffffii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiifii(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_fidf(index, a1, a2, a3) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vifiii(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiff(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiffi(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iffi(index, a1, a2, a3) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vijifi(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viifiiffiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiifi(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vififiif(index, a1, a2, a3, a4, a5, a6, a7) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiiiifi(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiifi(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiiiifi(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_jiij(index, a1, a2, a3) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
    return 0n;
  }
}

function invoke_viiiifffiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiiiiiiifffiiifiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16, a17, a18, a19, a20, a21) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16, a17, a18, a19, a20, a21);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_fiiifff(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiff(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiififi(index, a1, a2, a3, a4, a5, a6, a7, a8) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiifii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_ifff(index, a1, a2, a3) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vfffiii(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiiif(index, a1, a2, a3, a4, a5, a6, a7, a8) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiifiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiffiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vff(index, a1, a2) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vifffi(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viifiiii(index, a1, a2, a3, a4, a5, a6, a7) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiifiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16, a17) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16, a17);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiiifi(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_ffi(index, a1, a2) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_fff(index, a1, a2) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_fffff(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiffiifii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vfiii(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiifffii(index, a1, a2, a3, a4, a5, a6, a7) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiifiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiiiiif(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiifiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_fiiiff(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_fiiiif(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vfii(index, a1, a2, a3) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vffi(index, a1, a2, a3) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiiiiiiiff(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiif(index, a1, a2, a3, a4, a5, a6, a7) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiidiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiffii(index, a1, a2, a3, a4, a5, a6, a7) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiji(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vfff(index, a1, a2, a3) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiififf(index, a1, a2, a3, a4, a5, a6, a7) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vfffii(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiiiiiiiffi(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vifiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiiiiif(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_f(index) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)();
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_fiiffiii(index, a1, a2, a3, a4, a5, a6, a7) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vffiffi(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vffffffi(index, a1, a2, a3, a4, a5, a6, a7) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viffffii(index, a1, a2, a3, a4, a5, a6, a7) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viffiii(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viffffi(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viffffffffiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiffii(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_ifiiiiffffffii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiffffffffi(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vji(index, a1, a2) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iijii(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiifiii(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiffi(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viijiiii(index, a1, a2, a3, a4, a5, a6, a7) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_ifiii(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_fifffii(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vffffiii(index, a1, a2, a3, a4, a5, a6, a7) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiifif(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_jij(index, a1, a2) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
    return 0n;
  }
}

function invoke_ffiiii(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiiiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16, a17) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16, a17);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiidf(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiiiiifiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiiifi(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiifiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiifiiifiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_fijjj(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_jifii(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
    return 0n;
  }
}

function invoke_fiffff(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_fiiff(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiffffif(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiffifi(index, a1, a2, a3, a4, a5, a6, a7) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiffiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiiiiifi(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_fiiifiii(index, a1, a2, a3, a4, a5, a6, a7) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_ffii(index, a1, a2, a3) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiiiiifii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiffii(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiifi(index, a1, a2, a3, a4, a5, a6, a7, a8) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vidiii(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiifffi(index, a1, a2, a3, a4, a5, a6, a7) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiifff(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiid(index, a1, a2, a3, a4, a5, a6, a7) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiiidiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiiiiiidii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiidi(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_diiiid(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iijiii(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iijjiii(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vjjii(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_ijjiiii(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vdii(index, a1, a2, a3) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_idiiii(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vjjjjjjii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiijjj(index, a1, a2, a3, a4, a5, a6, a7, a8) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vijiif(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vijiii(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_fijii(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiijjjiijjji(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiijjj(index, a1, a2, a3, a4, a5, a6, a7) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_fiifii(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viififf(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiiiiiiijjj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiiiiiiiiiijjjii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16, a17, a18, a19) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16, a17, a18, a19);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiijjjii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiiiiijjj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiijjji(index, a1, a2, a3, a4, a5, a6, a7, a8) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiijjjiijjj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiijiii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiiiiiijj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiiiiiiiiijjj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiijjj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiijjjjijjj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vjjjii(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiijj(index, a1, a2, a3, a4, a5, a6, a7, a8) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiijjjfiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiijjj(index, a1, a2, a3, a4, a5, a6, a7, a8) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiiiiiiiiiiijjjii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16, a17, a18, a19, a20) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16, a17, a18, a19, a20);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiiiiiififii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiijiiii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_jjj(index, a1, a2) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
    return 0n;
  }
}

function invoke_viiiiiiiiiijj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiiiiiiiijj(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiiiidii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vjjjjii(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiiiiijjjiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16, a17) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16, a17);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_jiijj(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
    return 0n;
  }
}

function invoke_viiiijjij(index, a1, a2, a3, a4, a5, a6, a7, a8) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiijjij(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiififii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_jiiii(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1, a2, a3, a4);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
    return 0n;
  }
}

function invoke_viiiiiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

// Argument name here must shadow the `wasmExports` global so
// that it is recognised by metadce and minify-import-export-names
// passes.
function applySignatureConversions(wasmExports) {
  // First, make a copy of the incoming exports object
  wasmExports = Object.assign({}, wasmExports);
  var makeWrapper_pp = f => a0 => f(a0) >>> 0;
  var makeWrapper_p = f => () => f() >>> 0;
  var makeWrapper_ppp = f => (a0, a1) => f(a0, a1) >>> 0;
  var makeWrapper_pp____ = f => (a0, a1, a2, a3, a4) => f(a0, a1, a2, a3, a4) >>> 0;
  var makeWrapper_p_ = f => a0 => f(a0) >>> 0;
  wasmExports["malloc"] = makeWrapper_pp(wasmExports["malloc"]);
  wasmExports["pthread_self"] = makeWrapper_p(wasmExports["pthread_self"]);
  wasmExports["emscripten_builtin_memalign"] = makeWrapper_ppp(wasmExports["emscripten_builtin_memalign"]);
  wasmExports["emscripten_stack_get_end"] = makeWrapper_p(wasmExports["emscripten_stack_get_end"]);
  wasmExports["emscripten_stack_get_base"] = makeWrapper_p(wasmExports["emscripten_stack_get_base"]);
  wasmExports["_emscripten_stack_alloc"] = makeWrapper_pp(wasmExports["_emscripten_stack_alloc"]);
  wasmExports["emscripten_stack_get_current"] = makeWrapper_p(wasmExports["emscripten_stack_get_current"]);
  wasmExports["__cxa_get_exception_ptr"] = makeWrapper_pp(wasmExports["__cxa_get_exception_ptr"]);
  wasmExports["_wasmfs_mmap"] = makeWrapper_pp____(wasmExports["_wasmfs_mmap"]);
  wasmExports["_wasmfs_get_cwd"] = makeWrapper_p_(wasmExports["_wasmfs_get_cwd"]);
  return wasmExports;
}

// include: postamble.js
// === Auto-generated postamble setup entry stuff ===
var calledRun;

function callMain(args = []) {
  assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on Module["onRuntimeInitialized"])');
  assert(typeof onPreRuns === "undefined" || onPreRuns.length == 0, "cannot call main when preRun functions remain to be called");
  var entryFunction = _main;
  args.unshift(thisProgram);
  var argc = args.length;
  var argv = stackAlloc((argc + 1) * 4);
  var argv_ptr = argv;
  for (var arg of args) {
    (growMemViews(), HEAPU32)[((argv_ptr) >>> 2) >>> 0] = stringToUTF8OnStack(arg);
    argv_ptr += 4;
  }
  (growMemViews(), HEAPU32)[((argv_ptr) >>> 2) >>> 0] = 0;
  try {
    var ret = entryFunction(argc, argv);
    // if we're not running an evented main loop, it's time to exit
    exitJS(ret, /* implicit = */ true);
    return ret;
  } catch (e) {
    return handleException(e);
  }
}

function stackCheckInit() {
  // This is normally called automatically during __wasm_call_ctors but need to
  // get these values before even running any of the ctors so we call it redundantly
  // here.
  // See $establishStackSpace for the equivalent code that runs on a thread
  assert(!ENVIRONMENT_IS_PTHREAD);
  _emscripten_stack_init();
  // TODO(sbc): Move writeStackCookie to native to to avoid this.
  writeStackCookie();
}

async function run(args = programArgs) {
  assert(!calledRun);
  calledRun = true;
  if ((ENVIRONMENT_IS_PTHREAD)) {
    initRuntime();
    return;
  }
  stackCheckInit();
  preRun();
  if (runDependencies > 0) {
    await new Promise(resolve => dependenciesFulfilled = resolve);
  }
  var setStatus = Module["setStatus"];
  if (setStatus) {
    setStatus("Running...");
    // Yield to the event loop to allow the browser to paint "Running..."
    await new Promise(resolve => setTimeout(resolve, 1));
    // Then we want to clear the status text, but only after the rest of this function runs.
    setTimeout(setStatus, 1, "");
  }
  if (ABORT) return;
  initRuntime();
  preMain();
  Module["onRuntimeInitialized"]?.();
  consumedModuleProp("onRuntimeInitialized");
  var noInitialRun = Module["noInitialRun"] || false;
  if (!noInitialRun) callMain(args);
  postRun();
  checkStackCookie();
}

function checkUnflushedContent() {
  // Compiler settings do not allow exiting the runtime, so flushing
  // the streams is not possible. but in ASSERTIONS mode we check
  // if there was something to flush, and if so tell the user they
  // should request that the runtime be exitable.
  // Normally we would not even include flush() at all, but in ASSERTIONS
  // builds we do so just for this check, and here we see if there is any
  // content to flush, that is, we check if there would have been
  // something a non-ASSERTIONS build would have not seen.
  // How we flush the streams depends on whether we are in SYSCALLS_REQUIRE_FILESYSTEM=0
  // mode (which has its own special function for this; otherwise, all
  // the code is inside libc)
  var oldOut = out;
  var oldErr = err;
  var has = false;
  out = err = x => {
    has = true;
  };
  try {
    // it doesn't matter if it fails
    // In WasmFS we must also flush the WasmFS internal buffers, for this check
    // to work.
    _wasmfs_flush();
  } catch (e) {}
  out = oldOut;
  err = oldErr;
  if (has) {
    warnOnce("stdio streams had content in them that was not flushed. you should set EXIT_RUNTIME to 1 (see the Emscripten FAQ), or make sure to emit a newline when you printf etc.");
    warnOnce("(this may also be due to not including full filesystem support - try building with -sFORCE_FILESYSTEM)");
  }
}

var wasmExports;

if ((!(ENVIRONMENT_IS_PTHREAD))) {
  // Call createWasm on startup if we are the main thread.
  // Worker threads call this once they receive the module via postMessage
  // With async instantation wasmExports is assigned asynchronously when the
  // instance is received.
  createWasm().then(() => run());
}
