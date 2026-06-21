/**
 * AUDIO SLOT — no track is committed (licensing).
 *
 * To add sound:
 *   1. Drop a royalty-free track at  video/public/audio/track.mp3
 *      (and optional SFX under      video/public/audio/sfx/*.mp3)
 *   2. Flip HAS_AUDIO to true below.
 *
 * The trailer renders fine silent (captions carry the message). When enabled,
 * Trailer.tsx mounts <Audio src={staticFile(MUSIC_SRC)} />.
 *
 * Beat-map (where scene cuts want a hit), in seconds @ 30fps:
 *   S1→S2 ≈ 5s   S2→S3 ≈ 11s   S3→S4 ≈ 18s   S4→S5 ≈ 26s   S5→S6 ≈ 32s
 */
export const HAS_AUDIO = true;
export const MUSIC_SRC = "audio/warlands-trailer.mp3"; // ElevenLabs track (34s, matches trailer length)
export const MUSIC_VOLUME = 0.25; // low background level — captions carry the message, music sits under it
