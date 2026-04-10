import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { meditations } from "./schema";

const meditationData: (typeof meditations.$inferInsert)[] = [
  // === BREATH AWARENESS ===
  {
    title: "First Breath",
    description:
      "A gentle introduction to breath awareness. Perfect for your very first meditation.",
    category: "breath",
    durationSeconds: 180,
    difficulty: "beginner",
    script: `Welcome. Find a comfortable position and gently close your eyes.

Take a moment to settle in. Let your shoulders drop. Let your hands rest easily in your lap or by your sides.

Now, bring your attention to your breathing. You don't need to change it — just notice it. Feel the air entering through your nose, cool and light. Feel it leaving, warm and soft.

Notice the gentle rise of your chest or belly as you breathe in. And the soft fall as you breathe out.

If your mind wanders — and it will — that's completely okay. That's what minds do. Simply notice where it went, and gently guide your attention back to your breath. Each time you do this, you're building your mindfulness muscle.

Breathe in. Breathe out. In. And out.

Stay with this rhythm for a few more moments. There's nowhere else you need to be.

Now, slowly begin to widen your awareness. Notice the sounds around you. Feel the surface beneath you. When you're ready, gently open your eyes.

You just completed your first meditation. That's something to be proud of. Every journey begins with a single breath.`,
    voice: "shimmer",
  },
  {
    title: "Breathing Anchor",
    description:
      "Use your breath as an anchor to the present moment. A foundational practice for daily calm.",
    category: "breath",
    durationSeconds: 300,
    difficulty: "beginner",
    script: `Welcome. Let's take a few minutes to reconnect with the present moment through your breath.

Settle into a comfortable position. Close your eyes if that feels right, or soften your gaze downward.

Begin by taking three deep breaths. Breathe in slowly through your nose... and out through your mouth. Again, in... and out. One more time, in deeply... and release.

Now let your breathing return to its natural rhythm. Your breath is your anchor — always here, always now.

Focus your attention on the point where you feel your breath most clearly. Perhaps it's the tip of your nose, the back of your throat, or the rise and fall of your belly. Wherever you feel it most, rest your attention there.

Breathe in, and silently count "one." Breathe out, count "two." Continue counting up to ten, then start again. If you lose count, simply begin again at one. There's no failing here — only returning.

One... two... three... four...

Continue at your own pace.

If thoughts arise, imagine them as clouds passing through a clear sky. Acknowledge them, then let them drift on. Return to your breath. Return to counting.

Five... six... seven...

You're doing beautifully. Each breath is a moment of peace you're giving yourself.

Now, let go of the counting. Simply sit with your breath for a few more moments.

Begin to bring your awareness back to the room. Wiggle your fingers and toes. Take one final deep breath in... and let it go.

Open your eyes. Carry this sense of calm with you.`,
    voice: "shimmer",
  },
  {
    title: "Deep Breath Journey",
    description:
      "A longer breath meditation exploring different breathing techniques for deeper relaxation.",
    category: "breath",
    durationSeconds: 600,
    difficulty: "intermediate",
    script: `Welcome to this deeper breath practice. Give yourself permission to fully arrive in this moment.

Find your comfortable position. Close your eyes. Take a moment to scan your body from head to toe, releasing any tension you find along the way.

Let's begin with natural breathing. Simply observe your breath as it is — no need to control it. Notice its rhythm, its depth, its temperature. Spend a minute just watching.

Now, let's try diaphragmatic breathing. Place one hand on your chest and one on your belly. As you breathe in, let your belly expand like a balloon. Your chest stays relatively still. Breathe out, and feel your belly gently fall. This activates your body's relaxation response.

Belly rises... belly falls. Continue this for several breaths.

Now let's explore a calming technique: four-seven-eight breathing. Breathe in through your nose for a count of four. Hold gently for seven counts. Then exhale slowly through your mouth for eight counts.

In, two, three, four. Hold, two, three, four, five, six, seven. Out, two, three, four, five, six, seven, eight.

Let's do that two more times.

In, two, three, four. Hold, two, three, four, five, six, seven. Out, two, three, four, five, six, seven, eight.

One more time. In, two, three, four. Hold, two, three, four, five, six, seven. Out, two, three, four, five, six, seven, eight.

Beautiful. Return to natural breathing now. Notice how your body feels different than when we started. Perhaps your heartbeat has slowed. Perhaps your muscles feel softer.

Now let's try box breathing — equal counts for each phase. Breathe in for four counts. Hold for four. Out for four. Hold empty for four.

In, two, three, four. Hold, two, three, four. Out, two, three, four. Hold, two, three, four.

Continue this rhythm on your own for the next minute. If four counts feels too long, use three. If it feels too short, try five. Find your natural box.

Keep breathing in your box pattern. With each cycle, imagine you're drawing a square of light. Each side represents one phase of the breath. Trace it in your mind.

Now, release the pattern. Let your breath flow freely again. Notice the deep calm that has settled into your body. This is always available to you — just a few conscious breaths away.

Sit in this stillness for a moment. There's no rush.

Gently bring your awareness back. Feel the surface beneath you. Hear the sounds around you. Wiggle your fingers and toes.

When you're ready, open your eyes. You've just given yourself a profound gift of presence. Carry this calm into your day.`,
    voice: "shimmer",
  },

  // === BODY SCAN ===
  {
    title: "Gentle Body Scan",
    description:
      "Slowly scan through your body, releasing tension and building awareness of physical sensations.",
    category: "body_scan",
    durationSeconds: 300,
    difficulty: "beginner",
    script: `Welcome. This practice will guide you through a gentle scan of your body, helping you release tension and connect with how you feel.

Lie down or sit comfortably. Close your eyes. Take three deep breaths to settle in.

Bring your attention to the top of your head. Notice any sensations there — tingling, warmth, pressure, or nothing at all. Whatever you find is perfectly okay.

Move your attention down to your forehead. Let it smooth and soften. Release any furrow or tension.

Notice your eyes. Let them rest heavily in their sockets. Unclench your jaw. Let your tongue drop from the roof of your mouth. Let your lips part slightly.

Move down to your neck and shoulders — places where we carry so much tension. Imagine warmth flowing into these areas, softening them. Let your shoulders drop away from your ears.

Scan down through your arms, past your elbows, to your wrists and hands. Let your fingers uncurl.

Bring your attention to your chest. Feel it rising and falling with each breath. Notice your heartbeat — steady and reliable.

Move to your belly. Let it be soft. Release any holding.

Scan through your lower back, your hips. These areas work hard for you every day. Send them gratitude and ease.

Move down through your thighs, your knees, your shins. Notice the weight of your legs.

Finally, bring your attention to your feet. Feel each toe, the soles of your feet, your heels.

Now, expand your awareness to your whole body at once. Feel yourself as one unified, relaxed being.

Take a deep breath in, filling your entire body with fresh energy. And release.

Gently begin to move. Wiggle your fingers and toes. Stretch if it feels good. Open your eyes when you're ready.

You've just shown your body real care and attention. Well done.`,
    voice: "shimmer",
  },
  {
    title: "Complete Body Scan",
    description:
      "A thorough, unhurried body scan meditation for deep relaxation and body awareness.",
    category: "body_scan",
    durationSeconds: 600,
    difficulty: "intermediate",
    script: `Welcome to this complete body scan. For the next ten minutes, we'll journey through every part of your body, inviting deep relaxation as we go.

Find a comfortable position, ideally lying on your back. Close your eyes. Allow your body to be heavy against the surface beneath you.

Take five deep breaths. With each exhale, feel yourself sinking a little deeper into relaxation.

We'll begin at the top of your head. Imagine a warm, golden light resting there. This light brings deep relaxation to everything it touches.

Let it flow down to your forehead, smoothing away any worry lines. Feel it warm your temples. Let it flow around and behind your ears.

The light moves to your eyes. Feel the tiny muscles around your eyes soften completely. Your eyelids grow heavy and still.

It flows to your cheeks, your nose, your mouth. Unclench your jaw. Let your tongue rest. Feel the warmth flow down to your chin.

Now the light moves to your neck. Feel each vertebra release. The muscles on either side of your neck let go. You might notice your head sink a little deeper.

The warmth spreads across your shoulders — those faithful carriers of stress. Let them melt downward. Feel the light flow down your left arm. Past your bicep, your elbow, your forearm. Into your left wrist and hand. Feel each finger soften. Now the same through your right arm. Bicep, elbow, forearm, wrist, hand, and fingers.

The golden light returns to your chest. Feel your ribcage expand and contract with each breath. Notice the warmth spreading through your lungs, your heart.

It moves to your upper back — the broad muscles between your shoulder blades. Let them flatten and release. Feel your spine, each vertebra, as the warmth travels downward.

The light reaches your belly. This is your center. Let it be completely soft. No holding, no guarding. Just warmth and ease.

Feel it flow into your lower back and pelvis. These sturdy structures support everything. Send them deep appreciation and relaxation.

The warmth flows into your hips and down into your thighs. Feel the large muscles of your legs release their grip. Past your knees — let them unlock. Down through your calves and shins.

Into your ankles, the tops of your feet, the soles, and each individual toe. Your entire body is now bathed in warm, golden relaxation.

Take a moment to feel your whole body at once. From the crown of your head to the tips of your toes, you are one connected, relaxed being.

Rest here for a moment. There is nothing to do, nowhere to go. Just be.

Now, slowly begin to invite gentle movement back. Wiggle your fingers. Roll your wrists. Move your toes. Take a deep, energizing breath.

When you're ready, gently open your eyes. Move slowly. You've given your body a beautiful gift of attention and care. Carry this feeling of ease with you.`,
    voice: "shimmer",
  },

  // === STRESS RELIEF ===
  {
    title: "Quick Calm",
    description:
      "A rapid stress-relief technique for when you need to decompress in just a few minutes.",
    category: "stress",
    durationSeconds: 180,
    difficulty: "beginner",
    script: `Take a pause right here, right now. Whatever was happening before this moment can wait for three minutes.

Close your eyes. Take one big breath in through your nose — as deep as you can — and sigh it out through your mouth. Let the sound come out. Again. Deep breath in... and sigh it out.

One more. In deeply... and release everything.

Now, squeeze both your fists as tight as you can. Tighter. Hold for five seconds. Four. Three. Two. One. Release. Feel the difference. That release is what relaxation feels like.

Squeeze your shoulders up toward your ears. Hold them tight. Five. Four. Three. Two. One. Drop them. Feel the tension drain away.

Scrunch your whole face — eyes, nose, mouth, forehead. Hold it. Five. Four. Three. Two. One. Release. Let your face be smooth and soft.

Now simply breathe. In for four counts... out for six counts. The longer exhale activates your calming nervous system.

In, two, three, four. Out, two, three, four, five, six.

Again. In, two, three, four. Out, two, three, four, five, six.

Continue this rhythm for a few more breaths.

Notice how much calmer you feel already. Your body knows how to find peace — you just needed to give it permission.

Open your eyes. You're reset. You're ready.`,
    voice: "shimmer",
  },
  {
    title: "Stress Dissolve",
    description:
      "Release accumulated stress through guided breathing, visualization, and progressive relaxation.",
    category: "stress",
    durationSeconds: 300,
    difficulty: "beginner",
    script: `Welcome. Let's take five minutes to dissolve the stress you've been carrying.

Sit comfortably or lie down. Close your eyes. Give yourself full permission to let go for these next few minutes.

Start with three cleansing breaths. Breathe in calm... breathe out tension. In peace... out stress. In ease... out worry.

Now, imagine the stress in your body as a color — maybe red, or gray, or black. See it gathered in the places that feel tight. Your shoulders, your jaw, your stomach, wherever you feel it.

As you breathe in, imagine breathing in a cool, blue light. This light is pure calm. As you breathe out, see the stress color leaving your body with your breath. Dissolving into the air.

Blue light in... stress out. Cool calm in... tension out.

With each breath, there's less of the stress color and more of the calming blue. Your shoulders soften. Your jaw unclenches. Your stomach releases.

Keep breathing this way. Each inhale brings more calm. Each exhale carries away more stress.

Now, imagine the blue light filling your entire body. From your head to your feet, you're glowing with calm. The stress color is gone. There's only peace.

Take a moment to feel this lightness. This is your natural state — stress is the visitor, not the resident.

Take one final deep breath. Fill yourself completely with that calming light. And exhale with a gentle smile.

Wiggle your fingers and toes. Open your eyes. The stress has dissolved, and you are renewed.`,
    voice: "shimmer",
  },
  {
    title: "Tension Release",
    description:
      "A thorough progressive muscle relaxation combined with calming visualization for deep stress relief.",
    category: "stress",
    durationSeconds: 600,
    difficulty: "intermediate",
    script: `Welcome. For the next ten minutes, we're going to systematically release tension from your entire body and mind.

Find a comfortable position. Close your eyes. Take three slow, deep breaths.

We'll use a simple technique: tense each muscle group, hold briefly, then release. The contrast helps your body understand what true relaxation feels like.

Start with your feet. Curl your toes tightly. Hold... hold... and release. Feel the warmth flow in.

Point your feet away from you, tensing your calves. Hold... hold... and release. Let them go completely.

Tighten your thighs. Press them together or into the surface beneath you. Hold... hold... and release.

Squeeze your glutes. Hold... hold... and release.

Pull your belly button toward your spine. Tighten your core. Hold... hold... and release. Let your belly be soft.

Make fists with both hands. Squeeze tight. Hold... hold... and release. Spread your fingers wide, then let them rest.

Bend your arms and flex your biceps. Hold... hold... and release.

Push your shoulders up to your ears. Higher. Hold... hold... and drop them. Feel the relief.

Tilt your head gently to the right, stretching the left side of your neck. Hold... return to center. Now tilt left. Hold... return to center.

Scrunch your entire face. Eyes, nose, mouth, forehead — all scrunched tight. Hold... hold... and release completely.

Now, scan from your feet to your head. If any area still holds tension, breathe into it. Imagine your breath flowing directly to that spot, warming it, softening it.

Your entire body should feel noticeably different now — heavier, warmer, softer.

Let's add a visualization. Imagine you're lying on a warm beach. The sand molds perfectly to your body. A gentle breeze cools your skin. Waves lap rhythmically at the shore.

With each wave that comes in, it brings peace. With each wave that recedes, it carries away any remaining stress. In... peace. Out... stress.

The sun warms you gently. The sound of the water is hypnotic. You are completely safe and completely relaxed.

Stay on this beach for a few more moments. Let the waves continue their gentle work.

Now, slowly, the beach scene fades but the feeling of relaxation stays. Begin to notice the room around you. Feel the surface beneath you.

Take a deep, energizing breath. Stretch your body in whatever way feels good. Open your eyes slowly.

You've released deep tension. Your body and mind are refreshed. Carry this lightness forward.`,
    voice: "shimmer",
  },

  // === FOCUS & CONCENTRATION ===
  {
    title: "Sharpen Your Focus",
    description:
      "Train your attention with a simple yet powerful concentration exercise.",
    category: "focus",
    durationSeconds: 300,
    difficulty: "beginner",
    script: `Welcome. This practice will help sharpen your focus and train your ability to concentrate.

Sit upright with a straight but relaxed spine. Close your eyes. Take three centering breaths.

We're going to use a simple technique: single-point focus. Choose one point of focus — your breath at the tip of your nose.

Bring all of your attention to that single point. Feel the air enter — cool, precise. Feel it leave — warm, soft. Keep your attention right there, at the tip of your nose.

Your mind will wander. That's expected and completely normal. The practice isn't about preventing wandering — it's about noticing when you've wandered and bringing yourself back. Each return strengthens your focus.

If you get distracted, gently say "thinking" to yourself, and return to the breath at your nose.

Stay focused. The air in... the air out. Nothing else matters right now. Just this one point of sensation.

When you notice you've been lost in thought — and you will — celebrate that noticing. That moment of awareness is the real practice. Then return.

In... out. Cool... warm. Present... focused.

Continue for the next minute in silence, maintaining your single-point focus.

Well done. Whether you wandered a hundred times or stayed focused the whole time, you've just trained your brain. Concentration is like a muscle — it grows with practice.

Take a deep breath. Open your eyes. Notice how alert and clear you feel. Bring this sharpened focus into your next activity.`,
    voice: "shimmer",
  },
  {
    title: "Deep Concentration",
    description:
      "An extended focus session using counting, visualization, and sustained attention techniques.",
    category: "focus",
    durationSeconds: 600,
    difficulty: "intermediate",
    script: `Welcome to this deep concentration practice. Over the next ten minutes, we'll progressively deepen your focus using several techniques.

Sit with an upright, dignified posture. Close your eyes. Take five slow breaths to arrive fully.

We'll start with breath counting. Count each exhale from one to ten. If you lose count or go past ten, start over at one. This is harder than it sounds — and that's the point.

Begin. One... two... three...

Continue counting on your own. When your mind wanders, notice it with curiosity rather than frustration. Then return to one.

Now let's shift techniques. Visualize a candle flame in the center of your mind. See it clearly — the golden light, the gentle flicker, the steady core.

Keep your attention on this flame. If thoughts come, imagine them as breezes that might make the flame flicker. Observe them, but keep your gaze on the flame. Let it steady again.

The flame grows brighter as your concentration deepens. See its light filling your mind, pushing away the shadows of distraction.

Hold this image. If it fades, gently bring it back. The flame is always there — you just need to look.

Now let's try sustained attention on sound. Listen to the sounds around you without labeling them. Don't think "that's a car" or "that's a voice." Just hear pure sound. Let sounds come and go.

If you catch yourself labeling or following a story about a sound, simply return to raw listening. Sound without interpretation.

Continue listening with this pure attention.

Now, combine everything. Return to your breath. With each inhale, see the candle flame grow brighter. With each exhale, hear the sounds around you more clearly. Breath, light, and sound — all held in your wide, focused awareness.

This is concentration at its deepest — not narrow and strained, but wide and alert. You can hold multiple points of attention with ease.

Take a few more breaths in this expanded awareness.

Now, let go of all techniques. Simply sit with whatever arises. Notice how sharp and clear your mind feels. This clarity is always available to you.

Take a deep breath. Stretch. Open your eyes. Your mind is a precision instrument — and you've just tuned it. Carry this focus into your day.`,
    voice: "shimmer",
  },

  // === SLEEP ===
  {
    title: "Drift to Sleep",
    description:
      "A soothing wind-down meditation to help you release the day and ease into restful sleep.",
    category: "sleep",
    durationSeconds: 600,
    difficulty: "beginner",
    script: `Welcome. It's time to let go of the day and prepare for restful sleep.

Lie comfortably in your bed. Adjust your pillow, your blankets. Make sure you're warm and supported. Close your eyes.

Take a deep breath in... and let it out with a sigh. Again. In... and sigh it out. One more. In... and release everything.

Let your breathing become slow and effortless. There's nothing left to do today. Everything that needs your attention can wait until tomorrow. Right now, your only job is to rest.

Let's release the day. Think of everything that happened today as pages in a book. One by one, gently close each page. The morning... closed. The afternoon... closed. The evening... closed. The book is shut. Set it aside.

Now, imagine yourself sinking into a soft cloud. It supports every part of you perfectly. You're floating, weightless and warm.

The cloud slowly drifts downward, carrying you deeper into relaxation. With each breath, you sink a little more.

Feel your feet become heavy and still. Your legs melt into the cloud. Your hips and lower back release their grip.

Your hands are so heavy you couldn't move them if you tried. Your arms are made of warm sand. Your shoulders dissolve into softness.

Your neck releases. Your jaw unclenches. Your eyes are sealed shut with the gentlest weight. Your forehead is smooth and cool.

You're sinking deeper now. The world above is fading. There are no sounds that need your attention. No thoughts that need your response.

Just the soft rhythm of your breathing. In... and out. In... and out. Slower now.

Each breath takes you deeper. Each exhale releases you further. You're safe. You're warm. You're at peace.

Let yourself drift now. There's nowhere to go. Nothing to do. Just the gentle pull of sleep, welcoming you in.

Sleep well.`,
    voice: "shimmer",
  },
  {
    title: "Deep Sleep Journey",
    description:
      "An immersive guided journey through calming landscapes to guide you into deep, restorative sleep.",
    category: "sleep",
    durationSeconds: 900,
    difficulty: "beginner",
    script: `Welcome. Tonight, I'll guide you on a peaceful journey to help you find deep, restorative sleep.

Lie in your most comfortable sleeping position. Close your eyes. Let your body be heavy.

Take five slow breaths. With each exhale, let go of something from today. A worry... released. A responsibility... released. A conversation... released. A plan... released. A feeling... released.

Your mind is clearing like a sky after rain.

Now, imagine you're standing at the edge of a peaceful meadow at twilight. The sky is painted in deep purples and soft pinks. The air is perfectly warm. A gentle breeze carries the scent of lavender.

Begin to walk slowly through the meadow. The grass is soft beneath your feet. Fireflies begin to appear, tiny golden lights dancing around you. Each one carries away a thought, leaving your mind clearer.

Ahead, you see a gentle stream. As you approach, you hear its soft murmur — the most soothing sound in the world. Sit beside it.

Watch the water flow. It catches the last light of the sky and sparkles. Smooth stones line the bottom. The sound washes over you like a lullaby.

Place any remaining thoughts into the stream. Watch them float away downstream, growing smaller and smaller until they're gone.

The sky deepens into night. Stars begin to appear — first one, then dozens, then thousands. The sky is alive with soft, twinkling light.

Lie back in the soft grass beside the stream. The stars above you form gentle patterns. The stream whispers beside you. The grass holds you like a bed made just for you.

Your body is so heavy now. Your eyes could not open even if you wanted them to. Each breath is slower than the last.

The stars begin to blur as sleep approaches. The stream's song grows softer, more distant. The meadow embraces you in warmth and darkness.

You're drifting now. The meadow fades into a soft, warm darkness. There's only the rhythm of your breath and the distant whisper of water.

Deeper... softer... quieter...

Let sleep take you now. You are safe. You are at peace. Tomorrow will find you rested and renewed.

Sleep well. Sweet dreams.`,
    voice: "shimmer",
  },

  // === LOVING-KINDNESS ===
  {
    title: "Kindness for Yourself",
    description:
      "Begin a loving-kindness practice by directing warmth and compassion toward yourself.",
    category: "loving_kindness",
    durationSeconds: 300,
    difficulty: "beginner",
    script: `Welcome. Today we'll practice loving-kindness — one of the most transformative meditations there is. And we'll begin where it matters most: with you.

Sit comfortably. Close your eyes. Take three gentle breaths.

Place your hand over your heart if that feels comfortable. Feel its steady rhythm — this heart that has been beating for you every moment of your life without being asked.

Think of yourself as you are right now. Not an idealized version. Not a past version. You, in this moment, with all your imperfections, struggles, and strengths.

Silently repeat these phrases, directing them toward yourself with genuine warmth:

May I be happy.
May I be healthy.
May I be safe.
May I live with ease.

Again, slowly.

May I be happy. Really feel the wish. You deserve happiness.
May I be healthy. In body and mind.
May I be safe. Protected from harm.
May I live with ease. Free from unnecessary suffering.

If this feels uncomfortable or strange, that's normal. Many of us aren't used to directing kindness toward ourselves. But you deserve it just as much as anyone else.

One more time, with as much warmth as you can offer:

May I be happy.
May I be healthy.
May I be safe.
May I live with ease.

Feel the warmth spreading from your heart through your entire body. You are worthy of love and kindness — especially your own.

Take a deep breath. Let your hand return to your lap. Open your eyes.

You've just planted seeds of self-compassion. Water them often.`,
    voice: "shimmer",
  },
  {
    title: "Expanding Circle of Kindness",
    description:
      "Extend loving-kindness from yourself outward to loved ones, acquaintances, and all beings.",
    category: "loving_kindness",
    durationSeconds: 600,
    difficulty: "intermediate",
    script: `Welcome. In this practice, we'll expand a circle of loving-kindness from yourself outward, eventually embracing all beings.

Sit comfortably. Close your eyes. Take several deep breaths until you feel centered.

Place your attention on your heart area. Imagine a warm, glowing light there — like a small sun. This is your capacity for love and kindness, and it has no limits.

Begin with yourself. See yourself in your mind's eye, and offer these phrases:

May I be happy. May I be healthy. May I be safe. May I live with ease.

Feel the warmth of these wishes. The light in your heart glows brighter.

Now, bring to mind someone you love deeply — a partner, family member, dear friend, or even a pet. See their face. Feel your natural warmth toward them. Direct the phrases to them:

May you be happy. May you be healthy. May you be safe. May you live with ease.

The light in your heart expands, reaching this person, wrapping them in warmth.

Now, think of someone neutral — someone you see regularly but don't know well. A neighbor, a colleague, the person at the coffee shop. Bring them to mind and offer the same wishes:

May you be happy. May you be healthy. May you be safe. May you live with ease.

This is where the practice becomes transformative. Extending kindness beyond our inner circle.

Now — and this is the most challenging part — bring to mind someone you find difficult. Not someone who has caused deep harm, but someone who frustrates or annoys you. Hold their image gently, and try:

May you be happy. May you be healthy. May you be safe. May you live with ease.

If this feels forced, that's okay. The intention matters more than the feeling. Over time, this practice softens resentment and frees your own heart.

Finally, expand your circle to include all beings everywhere. Every person, every creature, every form of life:

May all beings be happy.
May all beings be healthy.
May all beings be safe.
May all beings live with ease.

The light from your heart now fills the entire world. It has no boundaries, no conditions. This is the full expression of loving-kindness.

Sit in this expanded warmth for a moment. Feel how spacious and free your heart feels.

Gently bring your awareness back. Take a deep breath. Open your eyes.

You've just practiced one of humanity's oldest and most powerful meditations. The kindness you sent out will ripple further than you know.`,
    voice: "shimmer",
  },

  // === MORNING START ===
  {
    title: "Morning Spark",
    description:
      "A quick, energizing meditation to start your day with clarity and positive intention.",
    category: "morning",
    durationSeconds: 180,
    difficulty: "beginner",
    script: `Good morning. Let's start this day with intention and energy.

Sit up tall. Roll your shoulders back. Take a deep, energizing breath in through your nose — fill your lungs completely. Hold for a moment at the top... and release.

Again. Big breath in — feel your body wake up. Hold... and release with energy.

One more. In deeply... hold... and out.

Now, set an intention for today. Not a to-do item, but a way of being. Perhaps it's patience. Or courage. Or joy. Or presence. Whatever word comes to mind, hold it.

Repeat silently: Today, I choose [your word]. I bring this quality to everything I do.

Take a moment to visualize your day going well. See yourself moving through your morning with energy. See yourself handling challenges with grace. See yourself ending the day satisfied and peaceful.

Take one final energizing breath. In... and out with a smile.

Open your eyes. You're awake, you're alive, and this day is full of possibility. Go make it yours.`,
    voice: "shimmer",
  },
  {
    title: "Mindful Morning",
    description:
      "A fuller morning practice combining breath, intention-setting, and gratitude to ground your day.",
    category: "morning",
    durationSeconds: 300,
    difficulty: "beginner",
    script: `Good morning. Let's take five minutes to ground ourselves before the day begins.

Sit comfortably. If you're still in bed, that's fine — just sit up against your pillows. Close your eyes.

Start by noticing that you're here. You woke up today. Your body carried you through the night and delivered you to a brand new morning. That alone is worth a moment of gratitude.

Take five deep breaths. With each one, feel more awake, more alive, more present.

One — feel your lungs expand fully.
Two — notice the energy building in your body.
Three — your mind is clearing.
Four — you're arriving in the present.
Five — you're here. Fully.

Let's practice gratitude. Think of three things you're grateful for this morning. They don't need to be big. A warm bed. A person who loves you. The sound of birds. Coffee waiting for you. Your health. Hold each one in your mind and really feel the gratitude.

Now, set your intention. Ask yourself: what kind of person do I want to be today? What quality do I want to bring to my interactions? Maybe it's kindness. Maybe it's focus. Maybe it's playfulness or courage.

Whatever arises, hold it gently. Repeat: Today, I choose to bring [your quality] to the world.

Visualize your day unfolding positively. See yourself at key moments — working, talking, creating — and see yourself embodying your intention.

Finally, take a deep energizing breath. Stretch your arms overhead. Roll your neck. Wiggle your fingers.

Open your eyes. You are present, grateful, and intentional. This is going to be a good day. Go gently, go boldly.`,
    voice: "shimmer",
  },
];

async function seed() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql, { schema: { meditations } });

  console.log("Seeding meditations...");

  await db.insert(meditations).values(meditationData).onConflictDoNothing();

  console.log(`Seeded ${meditationData.length} meditations.`);
}

seed()
  .then(() => {
    console.log("Seed complete.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
