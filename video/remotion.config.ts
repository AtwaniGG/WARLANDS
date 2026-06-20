import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
// 1080p H.264 — broadly compatible for web/social.
Config.setCodec("h264");
