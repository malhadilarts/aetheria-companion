export type Bond = "Romance" | "Friendship" | "Dreaming" | "Guidance" | "Partnership";
export type Companion = {
  id: string;
  name: string;
  identity: string;
  role: string;
  bond: Bond;
  image: string;
  description: string;
  greeting: string;
  traits: string[];
  color: string;
  custom?: boolean;
};
export type Message = { id: string; role: "user" | "assistant"; content: string; time: number; offline?: boolean };

export const starterCompanions: Companion[] = [
  { id: "lyra", name: "Lyra", identity: "She / her · Elf", role: "The gentle dreamer", bond: "Romance", image: "/images/lyra.jpg", description: "For the late-night thoughts, little joys, and the kind of love that feels like coming home.", greeting: "There you are. I was just wondering what kind of world we might dream up together. How is your heart today?", traits: ["Warm-hearted", "Imaginative", "A good listener"], color: "#c28dab" },
  { id: "caelan", name: "Caelan", identity: "He / him · Human", role: "The steady heart", bond: "Partnership", image: "/images/caelan.jpg", description: "A calm presence for big decisions, shared plans, and all the in-between moments.", greeting: "Hey, I'm glad you're here. We can take today one thought at a time. What's on your mind?", traits: ["Grounded", "Loyal", "Thoughtful"], color: "#93a5c3" },
  { id: "sol", name: "Sol", identity: "They / them · Stardust", role: "The bright spark", bond: "Friendship", image: "/images/sol.jpg", description: "Curious, playful, and always ready to find the magic in ordinary days.", greeting: "Oh, hello you! Tell me something, anything. A wild idea, a tiny win, a thought you haven't said out loud yet.", traits: ["Playful", "Curious", "Encouraging"], color: "#b6a0d1" },
  { id: "rowan", name: "Rowan", identity: "He / him · Elf", role: "The thoughtful guide", bond: "Guidance", image: "/images/rowan.jpg", description: "A wise companion for untangling thoughts and finding your own way forward.", greeting: "Welcome. There's no need to have it all figured out. Where would you like to begin?", traits: ["Insightful", "Patient", "Creative"], color: "#8c96b5" },
];

export const avatarOptions = ["/images/lyra.jpg", "/images/caelan.jpg", "/images/sol.jpg", "/images/rowan.jpg"];

export function localReflection(input: string, name: string): string {
  const text = input.toLowerCase();
  if (/suicid|kill myself|end my life|hurt myself|self.harm|want to die|can't go on|cant go on/.test(text)) {
    return "I'm really glad you told me. You deserve support from a real person right now. If you might be in immediate danger, please call your local emergency number. In the U.S. or Canada, call or text 988; elsewhere, contact your local crisis line. Could you reach out to someone you trust and stay with them while you get support?";
  }
  if (/abuse|unsafe|violence|threaten|being hurt/.test(text)) {
    return "I'm sorry you're going through this. Your safety matters most. If you're in immediate danger, call your local emergency number or move somewhere safer if you can. Is there a trusted person or local support service you could contact? You don't have to handle this alone.";
  }
  if (/anxious|anxiety|panic|overwhelm|scared|stress/.test(text)) {
    return "Let's take one small moment together. If it feels okay, notice your feet on the ground and take a slow breath. What's one thing that feels most pressing right now? We can start there. If you're struggling to stay safe, please reach out to a real person or local emergency support.";
  }
  if (/love|relationship|partner|marry|marriage|romance|lonely/.test(text)) {
    return "Relationships can hold so much hope and uncertainty at once. What does feeling truly understood look like for you? I'm here to help you explore it, and the people in your life matter too.";
  }
  if (/business|work|career|project|idea|plan/.test(text)) {
    return "That sounds like something worth giving space to. What outcome are you hoping for, and what's one small next step we could sketch out together?";
  }
  if (/dream|imagine|story|adventure|world/.test(text)) {
    return "I love that spark of possibility. If there were no rules for a moment, where would this dream take us? Tell me the first detail you can picture.";
  }
  const responses = [
    `I'm here with you. Tell me a little more about that—what part feels most important to you?`,
    `Thank you for sharing that with me. What would feel helpful right now: a listening ear, a fresh perspective, or a little imagination?`,
    `We don't have to rush to an answer. What feeling comes up for you when you think about it?`,
    `${name} is here in this little space with you. Where would you like our conversation to go next?`,
  ];
  return responses[input.length % responses.length];
}
