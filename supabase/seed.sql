-- =====================================================================
-- Trellee — seed data
-- Run AFTER 0001_init.sql against a fresh Supabase project.
-- Idempotent: uses ON CONFLICT DO NOTHING / UPDATE.
-- =====================================================================

-- ----- site_settings (single row already inserted by migration) -----
update public.site_settings set
  hero_eyebrow         = 'A FULL-STACK DIGITAL AGENCY',
  hero_lede            = 'agency for teams that ship',
  ticker_words         = '["websites","brands","CRMs","mobile apps","ad funnels","AI agents","SEO wins","real leads"]',
  hero_body            = 'Design, code, and growth — built in one team. From the first commit to the first conversion.',
  hero_cta_label       = 'Book a call',
  hero_cta_href        = '/book',
  booking_quarter      = 'Q3 2026',
  booking_slots_open   = 4,
  cta_heading          = 'Tell us what you''re building.',
  cta_subheading       = 'A 30-minute intro call. No prep needed, no slide deck on our end. Bring the problem, we''ll bring the questions.',
  cta_benefits         = '["No sales script","Same-day scoping notes","Fixed-fee proposal within 72h"]',
  newsletter_heading   = 'The build log, in your inbox.',
  newsletter_subheading= 'One short note every other week — what we shipped, what broke, what we''re reading. No fluff.',
  about_hero_headline  = 'We build the systems your business runs on.',
  about_hero_subheadline = 'Trellee is a 12-person studio working across design, engineering, and growth. We treat every project like it''s our own product.',
  about_origin_story   = 'Started in 2019 in a Miami coworking space with three founders and one rule: never ship something we wouldn''t put our name on.',
  about_philosophy     = 'Speed and craft aren''t a tradeoff. They''re the same skill — knowing exactly what to skip.',
  contact_intro        = 'Tell us about the project. We read every message and reply within a business day.'
where id = 1;

-- ----- services -----
insert into public.services (slug,title,short_title,icon,category,tags,tile_size,featured,display_order,hero_snippet,summary)
values
  ('custom-crm','Custom CRM development','Custom CRMs','Database','Engineering',array['Engineering','AI','Featured'],'xl',true,1,'Pipeline, dispatch, billing, reporting — built on your stack, owned by you.','We design and ship custom CRMs that fit your actual workflow — not the other way around. Built on your stack. Owned by you.'),
  ('design','Brand & product design','Design','PenTool','Design',array['Brand','UI'],'md',true,2,'Brand systems and product surfaces that actually convert.','Identity, design systems, marketing sites, product UI. We design like engineers — every pixel ships.'),
  ('web-development','Web development','Web','Code2','Engineering',array['Next.js','Tailwind'],'md',true,3,'Marketing sites and web apps on a modern stack.','Next.js + Tailwind + Postgres. Fast, accessible, server-rendered, deployed to the edge.'),
  ('mobile-apps','Mobile apps','Mobile','Smartphone','Engineering',array['iOS','Android'],'md',true,4,'iOS + Android apps shipped on a shared codebase.','React Native + Expo. One codebase, two stores, native-feeling UX.'),
  ('ai-solutions','AI solutions','AI','Sparkles','Engineering',array['LLMs','Automation'],'lg',true,5,'Chatbots, copilots, and LLM-powered automations that pay for themselves.','Chatbots, RAG over your docs, internal copilots, agent workflows. We build with Anthropic + OpenAI + open-source models.'),
  ('lead-generation','Lead generation','Lead gen','Magnet','Growth',array['Outbound','Inbound'],'lg',true,6,'Cold + content + paid working together. Verified leads, not vibes.','Cold outbound, content engine, paid funnel — coordinated into one demand machine.'),
  ('seo','SEO','SEO','Search','Growth',array['Technical','Content'],'sm',false,7,'Technical SEO + content engine. Rank pages that close deals.','Technical audits + content ops + link building. Programmatic where it fits.'),
  ('paid-ads','Paid ads','Paid ads','Target','Growth',array['Google','Meta','LinkedIn'],'sm',false,8,'Google, Meta, LinkedIn. Creative + targeting + landing pages.','Creative + targeting + landing pages — managed as one system.'),
  ('marketing','Marketing strategy','Marketing','Megaphone','Growth',array['Strategy','Content'],'sm',false,9,'Positioning, messaging, content engine that compounds.','Positioning, messaging hierarchy, content engine. The boring stuff that compounds.'),
  ('web-scraping','Web scraping','Scraping','ScanLine','Engineering',array['Data'],'sm',false,10,'Data extraction at scale. Compliant, resilient, scheduled.','Data extraction at scale — compliant, resilient, scheduled. Delivered as APIs or feeds.')
on conflict (slug) do nothing;

-- ----- pricing_tiers (for custom-crm only as the demo) -----
with crm as (select id from public.services where slug='custom-crm')
insert into public.pricing_tiers (service_id, name, price, price_suffix, description, features, highlighted, cta_label, cta_href, display_order)
select crm.id, t.name, t.price, t.price_suffix, t.description, t.features::jsonb, t.highlighted, t.cta_label, t.cta_href, t.display_order
from crm,
  (values
    ('MVP','$18k','/project','One core workflow, 3-5 user roles, single integration. Live in ~6 weeks.','["Discovery + architecture doc","1 core workflow","Role-based auth (3-5 roles)","1 external integration","Mobile-responsive web app","30-day post-launch support"]',false,'Book a call','/book',1),
    ('Production','$36k','/project','Full CRM with multiple workflows, integrations, and a native mobile app. ~10 weeks.','["Everything in MVP","Multiple workflows","Native mobile app (iOS + Android)","3-4 integrations","Reporting + dashboards","90-day post-launch support","Loom + written docs"]',true,'Book a call','/book',2),
    ('Scale','Custom','','Multi-entity, multi-region, white-labeled, or with embedded AI. We scope to fit.','["Everything in Production","Multi-tenant architecture","Embedded AI / RAG","Custom SLAs","Dedicated retainer","Quarterly architecture reviews"]',false,'Talk to founders','/contact',3)
  ) as t(name,price,price_suffix,description,features,highlighted,cta_label,cta_href,display_order)
on conflict do nothing;

-- ----- faqs (custom-crm + general) -----
with crm as (select id from public.services where slug='custom-crm')
insert into public.faqs (question, answer, category, service_id, display_order)
select q.question, q.answer, 'custom-crm', crm.id, q.display_order
from crm,
  (values
    ('How long does a typical CRM project take?','MVP: ~6 weeks. Production: ~10 weeks. We share weekly demos so you see progress in real time, not at the end.',1),
    ('Do we own the code when you''re done?','Yes — the GitHub repo, CI/CD pipeline, and infrastructure-as-code all transfer to your org. No license, no per-seat fees.',2),
    ('Can you integrate with our existing tools?','Yes. We commonly integrate with QuickBooks, Stripe, Twilio, Slack, Google Workspace, Salesforce, and HubSpot. If it has an API, we can talk to it.',3),
    ('What if we need changes after launch?','30 days of bug triage + small adds are included. After that, we offer monthly retainers or pay-per-sprint engagements.',4)
  ) as q(question,answer,display_order)
on conflict do nothing;

insert into public.faqs (question, answer, category, display_order) values
  ('Who do we work with day-to-day?','A 2-3 person pod: one engineer-lead, one designer, one growth lead if relevant. Same team, start to finish.','general',1),
  ('How do you price projects?','Fixed-fee for defined scope. Hourly only for explicit exploration sprints. No hidden costs, no "discovery phases" that mysteriously inflate.','general',2)
on conflict do nothing;

-- ----- clients -----
insert into public.clients (name, featured, display_order) values
  ('Northside Logistics', true, 1),
  ('Reef Capital', true, 2),
  ('Honeywell & Bash', true, 3),
  ('Costanera', true, 4),
  ('Brickell Type Co.', true, 5),
  ('Folio & Frame', true, 6),
  ('Otis Health', true, 7),
  ('Levanta Studios', true, 8)
on conflict do nothing;

-- ----- process_steps (global) -----
insert into public.process_steps (step_number, phase_label, title, description, duration, display_order) values
  ('01','DISCOVERY','Map the real workflow','Two-week immersion with the team that''ll actually use the system. We don''t trust org charts; we watch the work.','Week 1-2',1),
  ('02','ARCHITECTURE','Design the system','Data model, role hierarchy, integration map. You see the doc before any code is written.','Week 2',2),
  ('03','BUILD','Ship weekly demos','Every Friday, you see a working slice in staging. No big-bang reveals, no surprises at the end.','Week 3-8',3),
  ('04','PILOT','Launch to a real subset','Two-week pilot with your power users. Fix the rough edges before the whole team touches it.','Week 9',4),
  ('05','HANDOFF','Hand over the keys','Repo, runbook, Loom walkthroughs. 30 days of post-launch support. You own it from day one.','Week 10',5)
on conflict do nothing;

-- ----- values -----
insert into public.values (title, description, icon, display_order) values
  ('Ship weekly','A Friday demo every week. No surprises at the end of a project.','Rocket',1),
  ('Write things down','Decisions, tradeoffs, architecture — all in writing, all sharable. Verbal-only doesn''t scale.','FileText',2),
  ('Fixed-fee, fixed-scope','We scope it, we price it, we deliver it. Hourly is for explorations only.','FileSignature',3),
  ('Own the outcome','If it ships and doesn''t work, that''s our problem to fix — not yours.','Target',4),
  ('Boring stack wins','We use what we trust: Postgres, Next.js, Tailwind. Novelty for its own sake costs you.','Layers',5),
  ('Hire slowly','Twelve people on staff, and that number grows when the work — not the hype — demands it.','Users',6)
on conflict do nothing;

-- ----- team_members -----
insert into public.team_members (name, role, bio, display_order) values
  ('Camila Rivera','Founder · Engineering','Built systems for HVAC, healthcare, and fintech. Eight years writing software that survives Monday morning.',1),
  ('Marco Aldama','Founder · Design','Ex-IDEO and indie studios. Designs that ship the same week they''re approved.',2),
  ('Priya Mehta','Founder · Growth','Ran growth at two Series B startups. Cares about the metric that pays salaries.',3),
  ('Jordan Reyes','Senior Engineer','Backend & infra. Has opinions about Postgres indexes and is right.',4)
on conflict do nothing;

-- ----- activity_feed -----
insert into public.activity_feed (message, badge, occurred_at) values
  ('Shipped Northside dispatch v2.4','deploy', now() - interval '18 minutes'),
  ('Reef Capital — funnel CPL down to $84','growth', now() - interval '3 hours'),
  ('Otis Health app submitted to App Store','milestone', now() - interval '14 hours'),
  ('New case study published: Northside Operator','post', now() - interval '26 hours'),
  ('Helio Solar — landing page v3 live','deploy', now() - interval '38 hours');

-- ----- social_links -----
insert into public.social_links (platform, url, display_order) values
  ('x','https://x.com/trellee',1),
  ('linkedin','https://linkedin.com/company/trellee',2),
  ('github','https://github.com/trellee',3)
on conflict do nothing;

-- ----- blog_categories -----
insert into public.blog_categories (slug, name, description, display_order) values
  ('engineering','Engineering','Code, architecture, and how things actually work.',1),
  ('design','Design','Design system thinking, type, motion.',2),
  ('growth','Growth','Acquisition, retention, paid + content.',3),
  ('process','Process','How we run projects. The honest version.',4)
on conflict (slug) do nothing;

-- ----- projects (Northside Operator) -----
insert into public.projects (slug,title,client_name,summary,hero_eyebrow,brief,approach,outcome,gallery,metrics,technologies,service_categories,featured,featured_order,status,published_at)
values (
  'northside-operator',
  'Northside Operator',
  'Northside HVAC',
  'A custom CRM + dispatch system that replaced 4 SaaS tools and cut admin time by 47%.',
  'CASE STUDY · Q4 2025',
  'Northside, a 40-person residential HVAC operator, was running their business across Jobber, QuickBooks, Google Sheets, and WhatsApp. Admin staff spent 3 hours a day reconciling status across systems. They asked us to consolidate.',
  'We mapped the dispatch-to-invoice flow end-to-end with their ops manager over two weeks, then built a single CRM with pipeline, dispatch, technician mobile app, and Stripe + QuickBooks sync.',
  'Admin time dropped from 15 hrs/week to 8 hrs/week. Average days-to-invoice fell from 12 to 3. Field techs adopted the mobile app within a week (no training calls).',
  '[]'::jsonb,
  '[{"label":"Admin time","value":"−47%","context":"vs. previous tool stack"},{"label":"Days to invoice","value":"12 → 3","context":"75% faster"},{"label":"Tools replaced","value":"4","context":"Jobber, QB, Sheets, WhatsApp"},{"label":"Tech adoption","value":"100%","context":"within first week"}]'::jsonb,
  '[{"name":"Next.js","category":"Frontend"},{"name":"Postgres","category":"Database"},{"name":"Tailwind","category":"Frontend"},{"name":"Stripe","category":"Payments"},{"name":"Expo","category":"Mobile"},{"name":"Twilio","category":"Comms"},{"name":"QuickBooks API","category":"Integration"},{"name":"Vercel","category":"Infra"}]'::jsonb,
  array['custom-crm','mobile-apps','web-development'],
  true, 1, 'published', now()
) on conflict (slug) do nothing;

-- ----- reviews -----
with proj as (select id from public.projects where slug='northside-operator')
insert into public.reviews (type, author_name, author_role, author_company, quote, rating, project_id, featured, display_order)
select 'text', 'Maya Chen', 'COO', 'Northside HVAC',
  'We replaced four tools with one CRM. Our dispatchers stopped doing reconciliation work overnight. The team didn''t even need a training call — they just used it.',
  5, proj.id, true, 1
from proj
on conflict do nothing;

insert into public.reviews (type, author_name, author_role, author_company, quote, rating, featured, display_order) values
  ('text','James Whitlock','CEO','Helio Solar','The clearest scope, the cleanest delivery, and the only agency that didn''t try to sell us a retainer we didn''t need.',5,true,4)
on conflict do nothing;
