# AI Wrote Your Code — But Who Owns It?

## Teaser
AI-generated code has sixty-four percent more maintainability errors. If your codebase has no domain boundaries, nobody owns that mess.

## Summary
So the data's in from Q1 2026 and it's proper eye-opening. AI-generated code has one point six four times more maintainability errors and one point seven five times more logic bugs than code humans write alone. And here's the thing that connects to something I've banged on about for years. Where does AI dump code when it doesn't know where things belong? Straight into utils, shared, helpers. The exact folders that already had no clear owner.

When forty to seventy percent of your codebase is AI-generated, which is where a lot of teams are heading, those dumping grounds become toxic. Duplicated functions, orphaned logic, stuff nobody tests because nobody feels responsible for it.

The fix isn't banning AI tools. It's giving code somewhere to belong. Domain boundaries. Feature-based ownership. When your architecture says this folder handles payments and that folder handles onboarding, even AI-generated code lands in a place with a contract, with tests, with someone who cares.

You don't need to be a CTO to push this. If you're a senior engineer or a tech lead, you can champion domain boundaries tomorrow. That's the guardrail that actually works. Go have a look at feature-sliced design as a starting point.

## Deep Dive
Right, let me share something that's been rattling around my head for a few weeks now. The data on AI-generated code quality landed properly in Q1 this year and honestly it confirms what a lot of us felt in our gut but couldn't prove.

The numbers. AI-co-authored pull requests have one point seven times more issues than human-authored ones. Maintainability errors are one point six four times higher. Logic and correctness errors one point seven five times higher. And this one blew me away. Three hundred and twenty-two percent more privilege escalation paths in AI-generated code. Teams that chase velocity alone with AI tools are seeing three times more production incidents and fifty percent higher tech debt accumulation.

Now I'm not here to say don't use AI. I use it every day. It's brilliant for boilerplate, for exploring ideas, for getting a first pass down fast. But here's what nobody's really connecting yet, and this is the bit I want to dig into. The quality problem isn't just about the AI. It's about the architecture the AI is generating into.

Think about it. When you ask an AI tool to write a utility function, where does it put it? Utils. When you ask it to extract a shared type? Shared. Constants? Constants folder. Helpers? You get the picture. These are the exact folders I've been calling anti-patterns for years, long before AI was writing our code. And the reason they're anti-patterns hasn't changed. Nobody owns them. There's no domain. There's no contract. There's no clear responsibility.

Now multiply that problem by the fact that forty to seventy percent of your codebase might be AI-generated within the next year or two. That's not a hypothetical. That's where plenty of teams already are. Your utils folder isn't just a junk drawer anymore. It's a junk drawer that's being filled by a machine that works ten times faster than any human and has zero sense of where things belong.

I've seen this play out on a project last year. Team adopted Copilot aggressively, which is fine, but their codebase was organised the classic way. Components, utils, hooks, services, constants. Flat. No domain structure. Within three months they had fourteen different date formatting functions scattered across utils and helpers. Three of them had subtle bugs. Two were near-duplicates with slightly different signatures. Nobody knew which one to use, and the AI certainly didn't know either because it just kept generating new ones.

Contrast that with another team I advised. They'd already moved to a domain-driven structure before bringing in AI tools. Payments folder, onboarding folder, inventory folder. Each domain had its own utils if it needed them, its own types, its own tests. When AI generated code for the payments domain, it landed inside that boundary. The tests caught regressions. The code reviewer knew the context. The generated code had a home and an owner.

That's the principle I want you to take away. Code responsibility. Every piece of code in your system should have an answer to three questions. Who owns this? What domain does it serve? What breaks if this is wrong? When a human writes code, they often implicitly know the answers even if the architecture doesn't enforce them. When AI writes code, there's no implicit knowledge. The architecture is all you've got.

And this connects to something bigger happening in our industry right now. The engineering manager role is being reshaped. There's a brilliant report from DX this quarter calling it the most dramatic structural shift they've observed. Part of that shift is that strong individual contributors with AI tools can cover ground that used to require larger teams. But that means the architectural decisions, the boundaries, the guardrails, those matter more not less. The structure of your codebase is becoming your primary quality control mechanism.

Now here's the good news. You don't need permission to fix this. You don't need to be a CTO or a VP of Engineering. If you're a senior frontend engineer or a tech lead, you can start championing domain boundaries in your next sprint. Pick one area of your codebase. Let's say you've got payment-related components scattered across three folders with shared utilities in a central utils directory. Pull them together. Create a payments domain folder. Move the relevant components, hooks, types, and utilities into it. Write a short readme that says what belongs here and what doesn't. Set up the tests.

When your team sees that AI-generated code for payments now lands in a cohesive, tested, owned location instead of the general utils swamp, they'll get it. You won't need a presentation. The codebase will make the argument for you.

There's a brand new academic framework called Shift-Up that just came out on arXiv this month. It's about embedding software engineering practices as structural guardrails specifically for AI-native development. Worth a read if you want the theoretical backing. But the practical version is simpler. Give your code somewhere to belong and someone to answer for it.

One last thing. I've made every mistake I'm describing here. I spent years building codebases with a shared folder that I thought was tidy and well-organised. It wasn't. It was a slow-motion disaster that just happened to be alphabetically sorted. The difference now is that AI accelerates the disaster. What used to take two years of entropy takes three months.

So here's your one thing to go off and think about. Look at your codebase tomorrow. Find the folder with the most files that nobody feels personally responsible for. That's your biggest vulnerability in an AI-assisted world. Start there. Draw a domain boundary. Give that code an owner. That's the guardrail that actually works.
