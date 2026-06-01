/**
 * Database types — mirror of `supabase/migrations/0001_init.sql`.
 * Keep in sync with the schema. When you regenerate types from Supabase CLI
 * (`supabase gen types typescript`), you can replace this file wholesale.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ServiceRow = {
  id: string;
  slug: string;
  title: string;
  short_title: string | null;
  icon: string | null;
  category: string | null;
  tags: string[];
  tile_size: "sm" | "md" | "lg" | "xl";
  featured: boolean;
  display_order: number;
  hero_snippet: string | null;
  summary: string | null;
  problem_statement: string | null;
  approach_pillars: { title: string; description: string; icon?: string }[];
  deliverables: { title: string; description: string; icon?: string }[];
  hero_code: string | null;
  hero_code_lang: string | null;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
};

export type PricingTierRow = {
  id: string;
  service_id: string | null;
  name: string;
  price: string;
  price_suffix: string | null;
  description: string | null;
  features: string[];
  highlighted: boolean;
  cta_label: string;
  cta_href: string;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type FAQRow = {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  service_id: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type ClientRow = {
  id: string;
  name: string;
  logo_url: string | null;
  website_url: string | null;
  featured: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type ProjectMetric = { label: string; value: string; context?: string };
export type ProjectTechnology = { name: string; category?: string };
export type ProjectGalleryItem = {
  url: string;
  caption?: string;
  type?: "image" | "mock";
};

export type ProjectRow = {
  id: string;
  slug: string;
  title: string;
  client_name: string | null;
  client_id: string | null;
  summary: string | null;
  hero_eyebrow: string | null;
  brief: string | null;
  approach: string | null;
  outcome: string | null;
  cover_url: string | null;
  thumbnail_url: string | null;
  gallery: ProjectGalleryItem[];
  metrics: ProjectMetric[];
  technologies: ProjectTechnology[];
  service_categories: string[];
  featured: boolean;
  featured_order: number;
  status: "draft" | "published";
  published_at: string | null;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
};

export type ReviewRow = {
  id: string;
  type: "text" | "video";
  author_name: string;
  author_role: string | null;
  author_company: string | null;
  author_avatar_url: string | null;
  quote: string | null;
  rating: number | null;
  video_url: string | null;
  video_thumbnail_url: string | null;
  duration: string | null;
  project_id: string | null;
  featured: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type ProcessStepRow = {
  id: string;
  step_number: string;
  phase_label: string | null;
  title: string;
  description: string;
  duration: string | null;
  service_id: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type ValueRow = {
  id: string;
  title: string;
  description: string;
  icon: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type TeamMemberRow = {
  id: string;
  name: string;
  role: string | null;
  bio: string | null;
  avatar_url: string | null;
  links: { label: string; url: string }[];
  display_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type ActivityFeedRow = {
  id: string;
  message: string;
  badge: string | null;
  href: string | null;
  occurred_at: string;
  created_at: string;
};

export type SocialLinkRow = {
  id: string;
  platform: string;
  url: string;
  display_order: number;
  created_at: string;
};

export type BlogCategoryRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type BlogPostRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string | null;
  cover_url: string | null;
  category_id: string | null;
  author_id: string | null;
  reading_time: number | null;
  featured: boolean;
  status: "draft" | "published";
  published_at: string | null;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
};

export type BookingRow = {
  id: string;
  service_id: string | null;
  service_slug: string | null;
  time_slot_at: string | null;
  timezone: string | null;
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  notes: string | null;
  status: "new" | "contacted" | "scheduled" | "won" | "lost" | "cancelled";
  pipeline_stage: CrmStage;
  crm_notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ContactSubmissionRow = {
  id: string;
  name: string;
  email: string;
  company: string | null;
  budget: string | null;
  services: string[];
  message: string;
  source: string;
  status: "new" | "contacted" | "closed" | "spam";
  pipeline_stage: CrmStage;
  crm_notes: string | null;
  created_at: string;
  updated_at: string;
};

// ---------------------------------------------------------------- CRM
export type CrmStage =
  | "new"
  | "contacted"
  | "qualified"
  | "proposal"
  | "won"
  | "lost";

/** A lead normalized from either source table for the pipeline board. */
export type CrmLead = {
  source: "contact" | "booking";
  id: string;
  name: string;
  email: string;
  company: string | null;
  detail: string | null; // message (contact) or notes/service (booking)
  meta: string | null; // budget/services (contact) or time slot (booking)
  pipeline_stage: CrmStage;
  crm_notes: string | null;
  created_at: string;
};

export type InvoiceLineItem = {
  description: string;
  quantity: number;
  unit_price: number;
};

export type InvoiceRow = {
  id: string;
  number: string;
  status: "draft" | "sent" | "paid" | "void";
  client_name: string;
  client_email: string | null;
  client_company: string | null;
  client_address: string | null;
  issue_date: string;
  due_date: string | null;
  currency: string;
  line_items: InvoiceLineItem[];
  tax_rate: number;
  notes: string | null;
  total: number;
  created_at: string;
  updated_at: string;
};

// ---------------------------------------------------------------- Project tracker
export type PmProjectRow = {
  id: string;
  name: string;
  client_name: string | null;
  client_email: string | null;
  status: "active" | "on_hold" | "done" | "archived";
  description: string | null;
  due_date: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type PmTaskRow = {
  id: string;
  project_id: string;
  title: string;
  done: boolean;
  due_date: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
};

// ---------------------------------------------------------------- Website monitor
export type MonitoredSiteRow = {
  id: string;
  label: string;
  url: string;
  active: boolean;
  is_up: boolean | null;
  last_status_code: number | null;
  last_error: string | null;
  last_checked_at: string | null;
  last_changed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SiteSettingsRow = {
  id: 1;
  company_name: string;
  tagline: string | null;
  email: string | null;
  city: string | null;
  whatsapp_url: string | null;
  calendar_url: string | null;
  response_time: string | null;
  hero_eyebrow: string | null;
  hero_lede: string | null;
  ticker_words: string[];
  hero_body: string | null;
  hero_cta_label: string | null;
  hero_cta_href: string | null;
  stats: { label: string; value: string; suffix?: string; context?: string }[];
  booking_quarter: string | null;
  booking_slots_open: number | null;
  cta_heading: string | null;
  cta_subheading: string | null;
  cta_benefits: string[];
  newsletter_heading: string | null;
  newsletter_subheading: string | null;
  about_hero_headline: string | null;
  about_hero_subheadline: string | null;
  about_origin_story: string | null;
  about_philosophy: string | null;
  contact_intro: string | null;
  created_at: string;
  updated_at: string;
};

type SelectInsertUpdate<R> = {
  Row: R;
  Insert: { [K in keyof R]?: R[K] };
  Update: { [K in keyof R]?: R[K] };
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      site_settings: SelectInsertUpdate<SiteSettingsRow>;
      services: SelectInsertUpdate<ServiceRow>;
      pricing_tiers: SelectInsertUpdate<PricingTierRow>;
      faqs: SelectInsertUpdate<FAQRow>;
      clients: SelectInsertUpdate<ClientRow>;
      projects: SelectInsertUpdate<ProjectRow>;
      reviews: SelectInsertUpdate<ReviewRow>;
      process_steps: SelectInsertUpdate<ProcessStepRow>;
      values: SelectInsertUpdate<ValueRow>;
      team_members: SelectInsertUpdate<TeamMemberRow>;
      activity_feed: SelectInsertUpdate<ActivityFeedRow>;
      social_links: SelectInsertUpdate<SocialLinkRow>;
      blog_categories: SelectInsertUpdate<BlogCategoryRow>;
      blog_posts: SelectInsertUpdate<BlogPostRow>;
      bookings: SelectInsertUpdate<BookingRow>;
      contact_submissions: SelectInsertUpdate<ContactSubmissionRow>;
      invoices: SelectInsertUpdate<InvoiceRow>;
      pm_projects: SelectInsertUpdate<PmProjectRow>;
      pm_tasks: SelectInsertUpdate<PmTaskRow>;
      monitored_sites: SelectInsertUpdate<MonitoredSiteRow>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
