// Public links exposed by the desktop menus and section navigation.
var customNavHiggsfieldChildren = {
  Image: [
    ["Create Image", "/ai/image?model=gpt_image_2"],
    ["Edit Image", "/layers"],
    ["Cinematic Cameras", "/generate?mode=image&imageModel=cinematic-v1"],
    ["Canvas", "/canvas"],
    ["Soul Moodboard", "/moodboard"],
    ["Soul ID Character", "/character"],
    ["AI Influencer", "/ai-influencer-studio"],
    ["Mangaka", "/mangaka"],
    ["Photodump", "/ai/image?model=soul-v2&modal-photo-dump=true"],
    ["Relight", "/apps/relight"],
    ["Inpaint", "/layers?model=nano_banana_pro_inpaint"],
    ["Image Upscale", "/upscale"],
    ["Face Swap", "/apps/face-swap?type=image"],
    ["Character Swap", "/apps/character-swap"],
    ...modelLinks("/ai/image?model=", [
      ["Soul 2.0", "soul-v2"],
      ["Soul Cinema", "soul-cinematic"],
      ["Seedream 5.5", "seedream_5_5"],
      ["GPT Image 2.6 Sunburst", "gpt-image-2-6-sunburst"],
      ["GPT Image 2.6 Flare", "gpt-image-2-6-flare"],
      ["Nano Banana 2.1", "nano-banana-2-1"],
      ["Nano Banana Pro", "nano-banana-pro"],
      ["FLUX 3 Image", "flux-3-image"],
      ["Recraft V4.1", "recraft-v4-1"],
      ["Grok Imagine 2.0", "grok-image-2-0"],
      ["FLUX.2", "flux_2"],
      ["Z-Image", "z-image"]
    ]),
    ["Topaz", "/upscale"]
  ],
  Video: [
    ["Create Video", "/ai/video"],
    ["Cinema Studio", "/generate?mode=video"],
    ["Shorts Studio", "/shorts-studio"],
    ["Faceless Studio", "/faceless-studio"],
    ["Marketing Studio", "/marketing-studio"],
    ["Content Factory", "/content-factory"],
    ["Katana", "/katana"],
    ["Effects", "/effects/use"],
    ["3D Jutsu", "/3d-jutsu"],
    ["Higgsfield Explainer", "/faceless-studio"],
    ["Canvas", "/canvas"],
    ["Mixed Media", "/mixed-media"],
    ["Edit Video", "/start/agent?model=seedance_2_5_edit&mode=video"],
    ["Video Upscale", "/ai/video/edit?tool=upscale"],
    ["Higgsfield Reframe", "/ai/video/reframe"],
    ["Click to Ad", "/marketing-studio?tool=url-to-ad"],
    ["Change Color Palette", "/apps/video-rehex"],
    ["Relight", "/apps/video-relight"],
    ["Draw to Video", "/ai/video?video-inpaint=true&generationType=video"],
    ["Draw to Edit", "/ai/video?image-inpaint=true"],
    ...modelLinks("/ai/video?model=", [
      ["Seedance 2.5", "seedance_2_5"],
      ["Seedance 2.5 Flash", "seedance_2_5_flash"],
      ["Kling 4.0", "kling4_0"],
      ["Kling 4.0 Flash", "kling_4_0_flash"],
      ["Higgsfield Intone", "intone"],
      ["Gemini Omni Flash 1.2", "gemini-omni-flash-1-2"],
      ["FLUX.3 Video", "flux_3_video"],
      ["MiniMax H3", "minimax_h3"],
      ["Wan 3.0", "wan3_0"],
      ["Grok Imagine 1.5 Lite", "grok_video_v15_lite"],
      ["Grok Imagine 1.5", "grok_video_v15"],
      ["HappyHorse", "happy-horse"],
      ["Minimax Hailuo 2.3", "minimax-2.3"],
      ["Higgsfield DOP", "standard"]
    ]),
    ["Higgsfield Genjutsu", "/genjutsu-create"],
    ["Higgsfield Genjutsu Lite", "/genjutsu-create?model=genjutsu-lite"],
    ["FLUX.3 Upscale", "/ai/video/edit?tool=upscale&toolModel=flux-video-upscale"]
  ],
  Audio: [
    ["Text to Speech", "/audio?voiceMode=voiceover"],
    ["Voice Change", "/audio?voiceMode=change-voice"],
    ["Translate", "/audio?voiceMode=translate"],
    ...modelLinks("/audio?voiceMode=voiceover&audioModel=", [
      ["Seed Audio 1.0", "seed_audio"],
      ["Eleven v4", "elevenlabs_v4"],
      ["Eleven v4 Turbo", "elevenlabs_v4_turbo"],
      ["Eleven v3", "elevenlabs"],
      ["Qwen Audio 3.0", "qwen_audio"],
      ["MiniMax Speech 2.8 HD", "minimax"],
      ["Seed Speech", "seed_speech"]
    ])
  ],
  MCP: modelLinks("/mcp?tab=", [
    ["ChatGPT", "chatgpt"],
    ["Claude", "claude"],
    ["Claude Code", "claude-code"],
    ["Telegram", "telegram"],
    ["CLI", "cli"]
  ]),
  API: [
    ["Explore models", "https://open.higgsfield.ai/explore"],
    ["Documentation", "https://docs.higgsfield.ai/docs"],
    ["Pricing", "https://open.higgsfield.ai/pricing"],
    ["Cashback", "https://open.higgsfield.ai/cashback"],
    ["Status", "https://status.higgsfield.ai/"]
  ],
  "Cinema Studio": [
    ["Projects", "/generate#custom-nav-projects"],
    ["Cinema Studio Video", "/generate?mode=video"],
    ["Cinematic Cameras", "/generate?mode=image&imageModel=cinematic-v1"]
  ],
  Genjutsu: [
    ["Overview", "/genjutsu"],
    ["Community Presets", "/higgsfield-genjutsu-presets"],
    ["Genjutsu Lite", "/genjutsu-create?model=genjutsu-lite"]
  ],
  Contests: [
    ["All Contests", "/community/contests"],
    ["Global Film Festival submissions", "/contests/higgsfield-global-film-festival?tab=submissions"]
  ],
  Supercomputer: [["Pricing", "/supercomputer/pricing"]],
  Community: [
    ["Discovery", "/community"],
    ["Feed", "/community/feed"],
    ["Projects", "/community/projects"],
    ["Shots", "/community/generations"],
    ["Creators", "/community/creators"],
    ["Contests", "/community/contests"],
    ["Rooms", "/community/rooms"],
    ["Blogs", "/community/blogs"],
    ["Originals", "/community/originals"]
  ],
  Academy: [
    ["AI Creation Course", "/academy/courses/ai-creation"],
    ["Course Introduction", "/academy/courses/ai-creation/introduction"]
  ],
  Plugins: [
    ["Adobe Photoshop", "/plugins/photoshop"],
    ["Adobe Premiere Pro", "/plugins/premiere-pro"],
    ["Adobe After Effects", "/plugins/after-effects"],
    ["DaVinci Resolve", "/plugins/davinci"],
    ["Figma", "/plugins/figma"],
    ["Blender", "/plugins/blender"],
    ["Minecraft", "/plugins/minecraft"]
  ]
};

function modelLinks(prefix, entries) {
  return entries.map(([label, value]) => [label, prefix + value]);
}

var customNavHiggsfieldToolRoutes = /^\/(?:[a-z][a-z0-9-]{1,62}|ai\/(?:image|video)(?:\/[a-z][a-z0-9-]{1,62})?|(?:apps|plugins|effects|start|mcp)\/[a-z][a-z0-9-]{1,62})\/?$/i;
var customNavHiggsfieldScanMenus = [
  ["Image", "/ai/image"],
  ["Video", "/ai/video"],
  ["Audio", "/audio"],
  ["MCP", "/mcp"],
  ["Plugins", "/plugins/after-effects"]
].map(([parent, path]) => ({
  id: "header-" + parent.toLowerCase(),
  parent,
  trigger: 'nav[aria-label="Main"] a[id*="-trigger-"][aria-expanded][href="' + path
    + '"], nav[aria-label="Main"] a[id*="-trigger-"][aria-expanded][href^="' + path + '?"]',
  routes: customNavHiggsfieldToolRoutes
})).concat([
  {
    id: "community",
    parent: "Community",
    page: /^\/community(?:\/|$)/,
    selector: 'nav[aria-label="Community navigation"]',
    routes: /^\/community\/[a-z][a-z0-9-]{1,62}\/?$/i
  },
  {
    id: "marketing-studio",
    parent: "Video",
    page: /^\/marketing-studio(?:\/|$)/,
    selector: 'nav[aria-label="Marketing Studio"]',
    routes: /^\/marketing-studio\/(?:tools|templates|workflows|presets|ad-reference|product-link)\/?$/i
  },
  {
    id: "ads-studio",
    parent: "Ads Studio",
    page: /^\/ads-studio(?:\/|$)/,
    selector: '[role="navigation"][aria-label="Ads Studio"], nav[aria-label="Ads Studio"]',
    routes: /^\/ads-studio\/(?:ad-multiplier|templates|tools|workflows|presets)\/?$/i
  },
  {
    id: "supercomputer",
    parent: "Supercomputer",
    page: /^\/supercomputer(?:\/|$)/,
    selector: '[role="navigation"][aria-label="Supercomputer"], nav[aria-label="Supercomputer"], #supercomputer-layout [class~="group/sidebar"]',
    links: 'a[href="/supercomputer/skills"], a[href="/supercomputer/connectors"], a[href="/supercomputer/pricing"], a[href="/supercomputer/models"], a[href="/supercomputer/templates"]',
    routes: /^\/supercomputer\/(?:skills|connectors|pricing|models|templates)\/?$/i
  },
  {
    id: "cinema-studio",
    parent: "Cinema Studio",
    page: /^\/generate(?:\/|$)/,
    selector: '[role="navigation"][aria-label="Cinema Studio"], nav[aria-label="Cinema Studio"]',
    routes: /^\/generate(?:\/(?:templates|presets|effects))?\/?$/i
  }
]);

// Reviewed public desktop navigation, November 15, 2026.
var customNavSites = [{
  id: "higgsfield",
  name: "Higgsfield",
  hosts: ["higgsfield.ai", "www.higgsfield.ai"],
  home: "https://higgsfield.ai/",
  externalOrigins: ["https://open.higgsfield.ai", "https://docs.higgsfield.ai", "https://status.higgsfield.ai"],
  revision: 3,
  scanMenus: customNavHiggsfieldScanMenus,
  tabTheme: {
    attributes: ["data-theme"],
    accents: ["--color-q-brand-primary", "--hf-color-button-brand"],
    surfaces: ["--qc-background-secondary", "--hf-color-background-primary", "--color-surface-tertiary"],
    foregrounds: ["--qc-text-primary", "--color-text-primary", "--qc-text-inverse"],
    border: "--qc-border-default"
  },
  // Sidebar control from the Cinema Studio toolbar.
  sidebarIcon: {
    viewBox: "0 0 16 16",
    path: "M1.83333 3.83333C1.83333 3.46514 2.13181 3.16667 2.5 3.16667H13.5C13.8682 3.16667 14.1667 3.46515 14.1667 3.83333V12.1667C14.1667 12.5349 13.8682 12.8333 13.5 12.8333H2.5C2.13181 12.8333 1.83333 12.5349 1.83333 12.1667V3.83333Z M4.16667 5.5V10.5"
  },
  // House silhouette from the Cinema Studio sidebar's Home icon.
  homeIcon: {
    viewBox: "0 0 18 18",
    path: "M9.83115 1.26572C9.34763 0.87015 8.65237 0.870143 8.16885 1.26572L2.73137 5.71459C2.4267 5.96387 2.25 6.33674 2.25 6.7304V14.4375C2.25 15.1624 2.83763 15.75 3.5625 15.75H14.4375C15.1624 15.75 15.75 15.1624 15.75 14.4375V6.7304C15.75 6.33674 15.5733 5.96387 15.2687 5.71459L9.83115 1.26572Z"
  },
  sectionTargets: {
    "/generate#custom-nav-projects": 'button[aria-label="Search projects"]'
  },
  linkClasses: "text-qc-body-sm-medium hover:bg-qc-overlay-hover",
  logo: {
    viewBox: "0 0 20 20",
    path: "M18.3498 9.83713L18.3339 9.65759C18.1831 7.93447 17.0963 4.69261 14.0816 4.69261C11.8445 4.69261 10.1545 6.97097 8.66311 8.97967C7.47302 10.5883 6.4419 11.9683 5.3073 11.9683C5.00574 11.9357 4.61708 11.7805 4.3792 11.4294C4.16497 11.1108 4.10948 10.7026 4.22046 10.2126C4.39489 9.43684 5.39463 8.7182 6.44963 7.95063C7.02864 7.54238 7.6238 7.10955 8.03634 6.69311C9.22643 5.5091 9.82932 4.65164 9.82932 3.2717C9.82932 1.89176 9.09157 1.20565 8.47276 0.911636C7.23514 0.323844 5.41851 0.666781 4.26026 1.69583C4.08583 1.85922 3.91117 2.01418 3.75243 2.16119C2.58622 3.23097 1.80094 3.95781 0 3.40232V5.63972C2.38791 6.72588 4.39512 4.65164 5.15675 3.69633C5.74372 3.06758 6.36253 2.70006 6.82283 2.70006H6.84671C7.05298 2.70825 7.22741 2.78995 7.35454 2.93696C7.56081 3.18204 7.64018 3.46786 7.60038 3.78622C7.51305 4.45594 6.83875 5.23967 5.60113 6.09713C4.14928 7.10159 1.7218 8.78374 1.53122 10.8987C1.3884 12.4177 2.15003 13.9365 3.34012 14.5243C6.11669 15.8798 7.80665 13.5444 9.5994 11.0783C10.9719 9.1756 12.273 7.37103 14.0818 7.37103C15.7081 7.37103 16.311 8.75916 16.311 9.63301V9.80459L16.1523 9.83713C12.2095 10.5558 10.0595 14.3611 10.0595 16.1167C10.0595 17.8724 11.5034 19.375 13.2804 19.375C15.359 19.375 17.9293 17.5458 18.3419 12.4013L18.3578 12.2136H20V9.83737H18.3498V9.83713ZM16.1998 12.4746C15.8826 15.5531 14.3513 16.9904 13.4232 16.9904C13.0027 16.9904 12.4158 16.631 12.4158 15.9615C12.4158 15.2104 13.5026 12.932 15.946 12.2543L16.2316 12.1808L16.1998 12.4748V12.4746Z"
  },
  items: [
    ["Explore", "/"],
    ["Image", "/ai/image"],
    ["Video", "/ai/video"],
    ["Audio", "/audio"],
    ["MCP", "/mcp"],
    ["API", "https://open.higgsfield.ai/"],
    ["Cinema Studio", "/generate"],
    ["Genjutsu", "/genjutsu-create"],
    ["Miracle", "/miracle"],
    ["Contests", "/contests/talent-contest"],
    ["Shorts", "/shorts-studio"],
    ["Ads Studio", "/ads-studio"],
    ["GPU", "/gpu"],
    ["Playable", "/playable"],
    ["Supercomputer", "/supercomputer"],
    ["Community", "/community"],
    ["Academy", "/academy"],
    ["Plugins", "/plugins/after-effects"],
    ["Canvas", "/canvas"],
    ["Enterprise", "/enterprise"],
    ["Pricing", "/pricing"]
  ].map(([label, href]) => {
    const children = customNavHiggsfieldChildren[label]?.map(([label, href]) => ({ label, href }));
    return children ? { label, href, children } : { label, href };
  })
}];
