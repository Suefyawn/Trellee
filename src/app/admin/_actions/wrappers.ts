"use server";

/**
 * Thin server-action wrappers that the client components can import.
 * Each wrapper re-exports an underlying CRUD action so we can pass
 * partially-applied functions (e.g. `() => deleteServiceAction(id)`)
 * from Server Components to Client Components.
 */

import * as services from "./services";
import * as pricing from "./pricing-tiers";
import * as faqs from "./faqs";
import * as projects from "./projects";
import * as reviews from "./reviews";
import * as blog from "./blog";
import * as bookings from "./bookings";
import * as leads from "./leads";
import * as misc from "./misc";
import * as invoices from "./invoices";
import * as crm from "./crm";

export const upsertServiceAction = services.upsertService;
export const deleteServiceAction = services.deleteService;

export const upsertPricingTierAction = pricing.upsertPricingTier;
export const deletePricingTierAction = pricing.deletePricingTier;

export const upsertFAQAction = faqs.upsertFAQ;
export const deleteFAQAction = faqs.deleteFAQ;

export const upsertProjectAction = projects.upsertProject;
export const deleteProjectAction = projects.deleteProject;

export const upsertReviewAction = reviews.upsertReview;
export const deleteReviewAction = reviews.deleteReview;

export const upsertBlogPostAction = blog.upsertBlogPost;
export const deleteBlogPostAction = blog.deleteBlogPost;
export const upsertBlogCategoryAction = blog.upsertBlogCategory;
export const deleteBlogCategoryAction = blog.deleteBlogCategory;

export const updateBookingAction = bookings.updateBookingStatus;
export const updateLeadAction = leads.updateLeadStatus;

export const upsertClientAction = misc.upsertClient;
export const deleteClientAction = misc.deleteClient;
export const upsertTeamMemberAction = misc.upsertTeamMember;
export const deleteTeamMemberAction = misc.deleteTeamMember;
export const upsertValueAction = misc.upsertValue;
export const deleteValueAction = misc.deleteValue;
export const upsertProcessStepAction = misc.upsertProcessStep;
export const deleteProcessStepAction = misc.deleteProcessStep;
export const upsertActivityAction = misc.upsertActivity;
export const deleteActivityAction = misc.deleteActivity;
export const upsertSocialLinkAction = misc.upsertSocialLink;
export const deleteSocialLinkAction = misc.deleteSocialLink;
export const updateSiteSettingsAction = misc.updateSiteSettings;

export const upsertInvoiceAction = invoices.upsertInvoice;
export const updateInvoiceStatusAction = invoices.updateInvoiceStatus;
export const deleteInvoiceAction = invoices.deleteInvoice;

export const updateCrmStageAction = crm.updateCrmStage;
export const updateCrmNotesAction = crm.updateCrmNotes;
