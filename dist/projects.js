/** Replace these records with real work. Leave placeholder:false only once content is real. */
export const projects = [
  {
    id: "website",
    image: "assets/preview-website.png",
    imageAlt:
      "Illustrative placeholder: a small computer and browser floating on a lunar platform.",
    title: "A home for an idea",
    type: "Website",
    category: "Design & development",
    description:
      "A website with a point of view. A place to turn an idea into something people can explore.",
    featured: true,
    visual: "web",
    symbol: "↗",
    placeholder: true,
    role: "Design & development",
    formats: "Screenshots · Live website",
    previewTitle: "Something good\nstarts here.",
    previewSubtitle: "YOUR WEBSITE PROJECT",
    detail:
      "This space is ready for a website you’ve made. Add a few screenshots, the story behind it, and a link to the live experience.",
  },
  {
    id: "film",
    image: "assets/preview-film.png",
    imageAlt:
      "Illustrative placeholder: a little cinema projector casting a beam of stars.",
    title: "A story in motion",
    type: "Video",
    category: "Film & editing",
    description:
      "A short film, an edit, or a moment worth watching. Every frame has a little something to say.",
    featured: true,
    visual: "film",
    symbol: "▶",
    placeholder: true,
    role: "Direction & editing",
    formats: "Video · Behind the scenes",
    previewTitle: "EVERY FRAME\nA FEELING.",
    previewSubtitle: "YOUR NEXT FILM",
    detail:
      "A home for one of your videos. Add the finished film, a short description, and the part you played in bringing it to life.",
  },
  {
    id: "broadcast",
    image: "assets/preview-broadcast.png",
    imageAlt:
      "Illustrative placeholder: a retro broadcast monitor with a planet and orbital signals.",
    title: "Made for the big moment",
    type: "Broadcast graphic",
    category: "Graphics & motion",
    description: "On-screen graphics with a little extra energy.",
    featured: false,
    visual: "broadcast",
    symbol: "▤",
    placeholder: true,
    role: "Graphic & motion design",
    formats: "Still graphics · Motion preview",
    previewTitle: "ON AIR",
    previewSubtitle: "BROADCAST DESIGN",
    detail:
      "Show a broadcast graphic, title sequence, scoreboard, or lower third here. Still images and motion clips can sit together in this project.",
  },
  {
    id: "product",
    image: "assets/preview-product.png",
    imageAlt:
      "Illustrative placeholder: a curious futuristic object on a lunar plinth.",
    title: "From sketch to something real",
    type: "Product",
    category: "Ideas & making",
    description: "An idea that found its way into the real world.",
    featured: false,
    visual: "product",
    symbol: "◇",
    placeholder: true,
    role: "Concept & product design",
    formats: "Product photos · Process",
    previewTitle: "WHAT IF?",
    previewSubtitle: "AN IDEA MADE REAL",
    detail:
      "Use this space for something you’ve designed or made. Add photos, sketches, and the story of how it went from an idea to a real object or product.",
  },
  {
    id: "app",
    image: "assets/preview-app.png",
    imageAlt:
      "Illustrative placeholder: a small phone with simple interface shapes on an orbital platform.",
    title: "A small app, a useful idea",
    type: "App",
    category: "Apps & experiments",
    description: "A little experiment built to make something easier.",
    featured: false,
    visual: "app",
    symbol: "⌘",
    placeholder: true,
    role: "Product design & development",
    formats: "Screenshots · App demo",
    previewTitle: "Make room\nfor a good idea.",
    previewSubtitle: "YOUR APP PROJECT",
    detail:
      "A place for an app or digital experiment. Add screenshots, explain what it does, and include a demo or download link when it’s ready.",
  },
];
export function makeIntroduction(pageUrl) {
  return `I’m exploring Bernardo Musiello’s portfolio at ${pageUrl}. Help me get to know the person behind it in a friendly, straightforward way.\n\nKnown context: This is Bernardo’s personal home for websites, videos, broadcast graphics, products, and apps. The portfolio is currently a design preview; all five project examples are explicitly labeled placeholders, not verified finished work. The page does not yet state his background, tools, or availability. His GitHub profile is https://github.com/bernardopmusiello-droid and this portfolio is open source at https://github.com/bernardopmusiello-droid/bernardo-portfolio. The portfolio also links to his Instagram (@bernie_raidervision), LinkedIn profile, and email.\n\nIf you can access the page, describe the kinds of work he is interested in sharing, and suggest three thoughtful questions I could ask him. Clearly distinguish confirmed information from impressions. Do not invent achievements, clients, skills, or details about placeholder projects. If you cannot open the page, say so and use only the context above.`;
}
