/**
 * Seed script: generates cover images via Stability AI and inserts
 * 3 foundational blog posts into Supabase.
 *
 * Usage:
 *   npx tsx scripts/seed-blog-posts.ts
 *
 * Requires env vars: STABILITY_AI_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Supabase admin client (service role)
// ---------------------------------------------------------------------------
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ---------------------------------------------------------------------------
// Stability AI helper
// ---------------------------------------------------------------------------
async function generateImage(prompt: string): Promise<Buffer> {
  const apiKey = process.env.STABILITY_AI_API_KEY;
  if (!apiKey) throw new Error("STABILITY_AI_API_KEY is not configured");

  const formData = new FormData();
  formData.append("prompt", prompt);
  formData.append("output_format", "png");
  formData.append("aspect_ratio", "16:9");

  const res = await fetch(
    "https://api.stability.ai/v2beta/stable-image/generate/core",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, Accept: "image/*" },
      body: formData,
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Stability AI error (${res.status}): ${text}`);
  }

  return Buffer.from(await res.arrayBuffer());
}

async function uploadImage(
  buffer: Buffer,
  fileName: string
): Promise<string> {
  const { error } = await supabase.storage
    .from("images")
    .upload(fileName, buffer, { contentType: "image/png", upsert: false });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const {
    data: { publicUrl },
  } = supabase.storage.from("images").getPublicUrl(fileName);

  return publicUrl;
}

// ---------------------------------------------------------------------------
// Blog post content
// ---------------------------------------------------------------------------

const POST_1_CONTENT = `
There's a moment that almost everyone who comes to Ubud shares. You step off the motorbike, or out of the car, or off the plane — and something shifts. The air is different. The light is different. The pace of everything around you seems to slow just enough that you can hear yourself think for the first time in months.

And then, almost immediately, the question arrives: *What's going on here? What should I do? Where do I start?*

It's the universal Ubud question. And if you've asked it, you already know how frustrating the answer can be.

## The information problem

Ubud runs on word of mouth. Always has. The best cacao ceremony? Someone mentions it at breakfast. That incredible sound healing in the rice paddies? You hear about it two days after it happened. The community dinner that would have changed your week? It was posted in one of forty-seven WhatsApp groups you're not in yet.

There are Instagram accounts, flyers at cafes, word-of-mouth recommendations from people you met at ecstatic dance. But it's scattered. Fragmented. By the time you piece it together, the week is over.

I know this because I lived it.

## How I got here

My name is Benji. I grew up in South Africa, found yoga in my early twenties, and it became the thread that pulled me through the next decade. I opened a yoga studio in Edinburgh — built it from nothing, poured myself into it. When COVID hit, it took everything I'd built.

But it also cracked something open.

During lockdown in London, I started going to ecstatic dance. If you haven't tried it — imagine a room full of people dancing with their eyes closed, no alcohol, no small talk, just movement and music and the permission to feel whatever you're feeling. It sounds weird until you try it. Then it sounds like the most obvious thing in the world.

The ecstatic dance community had roots in Bali. People kept talking about Ubud — not as a holiday destination, but as a place where you could live differently. Where the things I was discovering in dark London warehouses were just... Tuesday.

I didn't plan to move here. I followed a pull. That's the most honest way I can describe it.

When I arrived, everything I'd been through — the substance abuse I was recovering from, the grief of losing my studio, the searching for something I couldn't name — started to make a strange kind of sense. Ubud has a way of putting your past in context. Not erasing it. Just showing you what it was building toward.

## The spark

Here's the thing about me: I have a technology background. I notice systems. And I noticed that Ubud's information ecosystem was beautifully chaotic — and frustratingly broken.

I became the person people asked: *"What's on this week?"* Not because I had special access, but because I was obsessed with knowing. I was in the WhatsApp groups. I followed the Instagram accounts. I asked around at every cacao ceremony and breathwork session and community dinner.

And eventually I thought: someone needs to weave all of this together. Not replace the chaos — Ubud's chaos is part of its magic — but make it navigable.

## What The Ubudian actually is

The Ubudian is built on three pillars:

**An events directory that actually works.** Comprehensive, honest, community-curated. Not just the polished retreats that can afford advertising, but the grassroots gatherings, the local ceremonies, the popup dinners, the jam sessions that happen because someone put the word out. If it's happening in Ubud, it should be findable here.

**Humans of Ubud.** Stories of the people who make this place what it is. Not influencer profiles or success narratives — real stories. The healer who came here broken and found her practice. The surfer who opened a dog rescue. The Balinese family that's been making offerings for seven generations. Every face you see at the rice paddy cafe has a story that would stop you in your tracks, if only someone asked.

**A weekly newsletter.** Think of it as a friend who knows everything that's happening and tells you about it over coffee. Not a tourist guide. Not a marketing email. A community ritual — events worth showing up for, stories worth reading, tips from people who actually live here.

## This isn't mine

I want to be clear about something: The Ubudian isn't my platform. It's the community's. I'm just the one who decided to start building it.

It works when you participate. Submit your events. Share your story. Tell us what we're missing — because we're definitely missing things. The goal isn't to be the authority on Ubud. The goal is to be the most honest mirror this community has.

If we do this right, newcomers find their footing faster. Long-termers discover things they didn't know existed. And the dozens of micro-communities that make Ubud extraordinary get a little more visible to each other.

## The deeper thread

Every community needs connectors. Weavers. People who make the invisible visible. I don't say that to be grandiose — it's just something I've observed. The best communities aren't the ones with the most activities. They're the ones where information flows, where people feel seen, where showing up is easy.

The Ubudian is my attempt to be that thread. To take everything I love about this place — its wildness, its depth, its refusal to be pinned down — and make it just a little more accessible to the people who need it.

Welcome. I'm glad you're here.
`.trim();

const POST_2_CONTENT = `
Ubud is a place where extraordinary people blend into the everyday.

The woman pouring your coffee ran a tech company in Berlin before she sold everything and moved here to study traditional Balinese healing. The guy on the mat next to you in yoga class survived a shipwreck in the Indian Ocean and wrote a book about it. The quiet man who tends the garden at your villa is a master woodcarver whose family has been creating sacred art for five generations.

You'd never know any of this unless someone asked.

That's what Humans of Ubud is for.

## Why I'm going first

I believe you can't ask people to be vulnerable unless you're willing to go first. So here's my story — not the polished version, the real one.

I grew up in South Africa. A country that teaches you, from a very young age, that the world is divided into us and them. I didn't question it as much as I should have, not for a long time. I got through my twenties the way a lot of people do — by numbing. Substances. Busyness. The performance of having it together.

Yoga cracked the first opening. It wasn't spiritual at first — it was physical. But the practice has a way of sneaking past your defenses. Breathe long enough, hold still long enough, and the things you've been avoiding start to surface.

I opened a yoga studio in Edinburgh. Built it from nothing. It became my identity — not just my livelihood but my proof that I was okay, that I'd figured something out. When COVID took it, I lost more than a business. I lost the story I was telling myself about who I was.

London during lockdown was bleak. But someone dragged me to an ecstatic dance in a warehouse in Hackney, and something shifted. The music, the movement, the complete permission to fall apart on a dance floor — it wasn't yoga, but it was the same medicine in a different container.

The ecstatic dance community kept pointing toward Bali. Toward Ubud specifically. And I kept resisting until I couldn't anymore.

My first group ceremony here — I won't say which kind — cracked everything wide open. Decades of held pain, held grief, held shame. I wept for hours. And when I opened my eyes, there were strangers holding space for me with a steadiness I'd never experienced. Not fixing me. Not advising me. Just witnessing.

That's when I understood something that I now believe is the most important thing I've ever learned: **healing happens in community, not in isolation.** You can meditate alone. You can journal alone. You can do all the inner work in solitude. But the thing that actually transforms you is being seen — fully, honestly, imperfectly — by other humans.

I'm still navigating the edges. I don't have it figured out. Ubud didn't fix me. But it gave me a community where the work is possible.

## The bubbles

Here's something nobody tells you about Ubud: it's not one community. It's dozens.

There's the yoga and wellness world — teachers, students, retreat centers, the whole ecosystem. There's the ecstatic dance community, which overlaps with contact improv and zouk but is its own thing. There's the fire arts scene. The digital nomad coworking crowd. The long-term expat families. The Russian community, which is significant and largely separate. The Balinese local life, which most expats barely touch despite living in the middle of it. The fitness people. The tourists on retreat who are here for two weeks and gone.

Most people live in one or two of these bubbles. They might not even know the others exist. You can be deeply connected in one layer of Ubud and completely invisible in another.

Humans of Ubud is an attempt to bridge those bubbles. When a fire dancer shares her story and a yoga teacher reads it and recognizes something of herself — that's the magic. When a Balinese farmer talks about what it's like to watch his village change and an expat entrepreneur reads it and adjusts how she shows up — that's what we're after.

## What we're looking for

We're not looking for polished success stories. Ubud has plenty of those — the Instagram version, the "I quit my corporate job and now I drink smoothies in paradise" narrative. That story has its place, but it's not what we're after.

We want the real texture:

- The struggle that brought you here — not just the triumph that followed
- The moment Ubud surprised you — when it wasn't what you expected
- The part of yourself you discovered — especially if it wasn't pretty
- The relationship you have with this place — messy, complicated, evolving

Healers. Artists. Entrepreneurs. Misfits. Seekers. Parents. Locals. Nomads. Dreamers. Anyone who's leaning into their edges and willing to talk about what that feels like.

## The invitation

If you have a story — or you know someone who does — we'd love to hear from you.

Here's how it works: we come to you. Your favourite cafe, your studio, a bench overlooking the Campuhan ridge walk. We sit, we listen, we ask questions. Then we craft something honest — not a profile, not a bio, but a narrative that captures who you are and why you're here.

We'll work with you to make sure it feels right. Your words, your truth, your boundaries.

Your story might be the reason someone else feels less alone. It might be the bridge between two bubbles that didn't know they had something in common. It might simply be the thing that needed to be said out loud.

If that resonates, [reach out](/contact). We're listening.

## The deeper thread

Here's what I've observed, over and over, in ceremony, in dance, in conversation: when one person shares authentically, it gives permission to everyone else. Vulnerability is contagious — not in a performative way, but in the way that truth tends to open doors.

That's how community deepens. Not through networking events. Not through Instagram collaborations. Through witnessed vulnerability. Through the simple, terrifying, beautiful act of saying *this is who I really am* and having someone respond with *me too.*

That's what Humans of Ubud is about. And it starts with all of us.
`.trim();

const POST_3_CONTENT = `
Let's start with the Instagram version.

Golden hour over rice terraces. A $3 smoothie bowl that looks like edible art. Bare feet on warm stone. "Living my best life" captions. Yoga at sunrise, waterfall by noon, farm-to-table dinner at sunset. Paradise found.

All of that is real, by the way. Those moments exist. I've lived them. They're beautiful.

But they're not the whole story. Not even close.

## The honeymoon

Everyone's first weeks in Ubud are magical. I don't say that with cynicism — I mean it. There is a genuine enchantment to this place when everything is new.

The rice terraces really do take your breath away. The food really is incredible and absurdly affordable. The daily offerings on every doorstep — tiny baskets of flowers and incense placed with such care — really do slow you down and make you wonder what you've been missing.

You go to your first yoga class and it's better than anything at home. You wander into a cacao ceremony and weep (in a good way). You meet someone at a cafe and within twenty minutes you're having the deepest conversation of your year. You think: *I've found it. This is the place. Why doesn't everyone live here?*

This phase is real. It's also incomplete.

## The confrontation

Somewhere around month three — give or take — something shifts. The enchantment doesn't disappear exactly, but it makes room for some less comfortable truths.

**The revolving door.** You've made friends. Beautiful, open, interesting people. And then they leave. Because most people in Ubud are passing through — two weeks, a month, a season. The person you shared your deepest fears with at a breathwork session flies to Thailand on Tuesday. Your yoga buddy goes back to Melbourne. The group you connected with at that community dinner dissolves into a dozen different timezones.

You start over. And over. And over.

**The privilege reckoning.** At some point, you do the math. Your comfortable life here — the villa, the coworking space, the organic meals, the daily yoga — costs less than rent in a shared flat in London. You're living well on what, in your home country, would be a modest income. And the Balinese people who make your life possible are earning a fraction of what you spend.

This isn't a reason not to be here. But it's something you have to sit with, and it changes you if you let it.

**The cultural boundary.** The Balinese are extraordinarily welcoming. They will feed you, include you in ceremonies, smile at your clumsy attempts at Bahasa. But there are layers of this culture that are not for you, and it can take a long time to understand where those lines are. Ubud welcomed you, but Ubud also has its own life that existed for centuries before you arrived and will continue long after you leave.

## The bubbles problem

Here's something that took me months to understand: Ubud's community isn't one community. It's dozens of overlapping circles, and they don't always overlap.

The yoga and wellness people. The ecstatic dance crowd. The digital nomads at coworking spaces. The long-term expat families. The Russian-speaking community. The fitness and Crossfit scene. The fire dancers and contact improvisers. The Balinese local life that most foreigners barely touch.

You can be "connected" to hundreds of people and still feel like you don't belong anywhere. You can have forty-seven WhatsApp groups on your phone and still message a friend asking *"What's happening this week?"*

The paradox of Ubud: a place famous for community where loneliness is one of the most common unspoken experiences.

## Finding your people

It happens. But it doesn't happen the way you expect.

It doesn't happen through "networking." It doesn't happen by going to the most popular events. It doesn't happen by being the most open, most spiritual, most wellness-forward version of yourself.

It happens through consistency. Showing up at the same ecstatic dance every week. Going to the same warung until the owner knows your order. Saying yes to the community dinner when you're tired and would rather stay home. Joining the volunteer day even though you don't know anyone.

And it happens through imperfection. The real connections I've made in Ubud came not from performing wellness but from admitting that I was struggling. From saying "I don't have it figured out" in a place where everyone seems to have it figured out. From being willing to be seen mid-process rather than post-transformation.

Ecstatic dance was my gateway. But the real community — the people I'd call at 2am, the people who know my actual story — came from showing up over and over, consistently and imperfectly, until the revolving door stopped revolving and the people who were still there became family.

## The deeper work

There's a saying in Ubud that I've heard from at least a dozen different people: *"Bali will show you everything you haven't dealt with."*

It's said lightly, usually with a laugh, but it's painfully accurate.

Something about this place — the pace, the beauty, the space, the ceremonies, the sheer number of healing modalities available — strips away the distractions you've been hiding behind. Without the job that consumed you, the social calendar that kept you busy, the routine that kept you numb, you're left with... yourself. All of it.

The people who stay and thrive in Ubud are not the ones who arrived healed. They're the ones who arrived willing. Willing to sit with discomfort. Willing to let the place change them. Willing to lean into the confrontation rather than island-hopping away from it.

I've seen people arrive in Ubud full of certainty and leave three months later completely rearranged. I've seen people who came for a yoga retreat and are still here five years later, doing work they never imagined. I've seen people run away from the confrontation to Lombok, to the Gilis, to Thailand — only to come back because they realized the thing they were running from was inside them.

Ubud doesn't fix you. But it creates the conditions where fixing yourself becomes possible — if you let it.

## You're not alone in this

If you're reading this and recognizing your own experience — the honeymoon, the confrontation, the loneliness, the slow building of something real — I want you to know you're not alone. Not even close. Almost everyone who stays in Ubud long enough goes through some version of this.

That's part of why The Ubudian exists. Not to sell you a fantasy of expat paradise, but to be honest about what this life actually looks like — and to make the journey a little less isolating.

Home isn't a place you find. It's a feeling you build — through roots, through relationship, through the willingness to be changed by where you are. That's what The Ubudian is about: helping you build that feeling faster, so you spend less time wondering what's going on and more time being part of it.

Welcome to the real Ubud. It's messier than the Instagram version. It's also infinitely more beautiful.
`.trim();

// ---------------------------------------------------------------------------
// Image prompts
// ---------------------------------------------------------------------------
const IMAGE_PROMPTS = [
  "Lush green rice terraces in Ubud Bali at golden hour, warm community gathering, tropical foliage, watercolor illustration style with deep green and gold tones, editorial magazine cover",
  "Close-up portrait collage of diverse faces in Bali, warm natural lighting, authentic expressions, tropical garden background, editorial photography style with warm earth tones",
  "Ubud Bali street scene with motorbikes and temples, expat cafe life, rice paddies in background, warm cinematic lighting, editorial illustration with green and terracotta tones",
];

// ---------------------------------------------------------------------------
// Post metadata
// ---------------------------------------------------------------------------
interface PostData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  archetype_tags: string[];
  meta_title: string;
  meta_description: string;
  image_prompt: string;
}

const POSTS: PostData[] = [
  {
    title: "What is The Ubudian?",
    slug: "what-is-the-ubudian",
    excerpt:
      "The origin story of a community platform born from the question every Ubud newcomer asks: \"What's going on this week?\"",
    content: POST_1_CONTENT,
    archetype_tags: ["seeker", "explorer", "creative", "connector", "epicurean"],
    meta_title: "What is The Ubudian? | Community Platform for Ubud, Bali",
    meta_description:
      "The origin story of The Ubudian — a community media platform connecting Ubud's events, stories, and people. Events, Humans of Ubud, and a weekly newsletter.",
    image_prompt: IMAGE_PROMPTS[0],
  },
  {
    title: "Humans of Ubud: An Invitation",
    slug: "humans-of-ubud-an-invitation",
    excerpt:
      "Why we're telling the stories behind the faces you see at the rice paddy cafe, the ecstatic dance floor, and the ceremony — starting with our own.",
    content: POST_2_CONTENT,
    archetype_tags: ["seeker", "connector", "creative"],
    meta_title:
      "Humans of Ubud: An Invitation | Stories from Bali's Heart",
    meta_description:
      "Behind every face in Ubud is a story that would stop you in your tracks. Humans of Ubud shares authentic stories from healers, artists, seekers, and misfits.",
    image_prompt: IMAGE_PROMPTS[1],
  },
  {
    title: "The Ubud Expat Experience: Beyond the Instagram Fantasy",
    slug: "the-ubud-expat-experience",
    excerpt:
      "Rice paddies, ceremonies, and \"living the dream\" — what Ubud's expat life actually looks like when the honeymoon ends.",
    content: POST_3_CONTENT,
    archetype_tags: ["explorer", "seeker", "connector"],
    meta_title:
      "The Ubud Expat Experience: Beyond the Instagram Fantasy | The Ubudian",
    meta_description:
      "What living in Ubud, Bali actually looks like — the honeymoon, the confrontation, the loneliness, and how you find your people. An honest guide for expats.",
    image_prompt: IMAGE_PROMPTS[2],
  },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log("Starting blog post seed...\n");

  for (const post of POSTS) {
    console.log(`Processing: "${post.title}"`);

    // --- Generate cover image ---
    let coverUrl: string | null = null;
    try {
      console.log("  Generating cover image...");
      const buffer = await generateImage(post.image_prompt);
      const fileName = `blog/${post.slug}-${Date.now()}.png`;
      coverUrl = await uploadImage(buffer, fileName);
      console.log(`  Image uploaded: ${coverUrl}`);
    } catch (err) {
      console.error(
        `  Image generation failed: ${err instanceof Error ? err.message : err}`
      );
      console.log("  Continuing without cover image...");
    }

    // --- Check if post already exists ---
    const { data: existing } = await supabase
      .from("blog_posts")
      .select("id")
      .eq("slug", post.slug)
      .single();

    if (existing) {
      console.log(`  Post "${post.slug}" already exists — updating...`);
      const { error } = await supabase
        .from("blog_posts")
        .update({
          title: post.title,
          excerpt: post.excerpt,
          content: post.content,
          cover_image_url: coverUrl,
          status: "published",
          published_at: new Date().toISOString(),
          is_placeholder: false,
          archetype_tags: post.archetype_tags,
          meta_title: post.meta_title,
          meta_description: post.meta_description,
        })
        .eq("id", existing.id);

      if (error) {
        console.error(`  Update failed: ${error.message}`);
      } else {
        console.log(`  Updated successfully.\n`);
      }
    } else {
      console.log("  Inserting new post...");
      const { error } = await supabase.from("blog_posts").insert({
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        cover_image_url: coverUrl,
        status: "published",
        published_at: new Date().toISOString(),
        is_placeholder: false,
        archetype_tags: post.archetype_tags,
        meta_title: post.meta_title,
        meta_description: post.meta_description,
      });

      if (error) {
        console.error(`  Insert failed: ${error.message}`);
      } else {
        console.log(`  Inserted successfully.\n`);
      }
    }
  }

  console.log("Done!");
}

main().catch(console.error);
