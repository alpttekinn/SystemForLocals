// Data access layer barrel export
// All data modules re-exported from a single entry point

export {
  getTenantBySlug,
  requireTenantId,
  getTenantBranding,
  getTenantContact,
  getTenantSeo,
  getTenantFeatures,
  getBusinessHours,
  getReservationRules,
  getSpecialDates,
  getBlockedSlots,
} from './tenant'

export {
  getMenuCategories,
  getMenuItems,
  getMenuWithItems,
  getFeaturedMenuItems,
} from './menu'

export {
  getGalleryItems,
  getCoverImage,
} from './gallery'

export {
  getActiveCampaigns,
  getCampaignBySlug,
  getAllCampaigns,
} from './campaigns'

export {
  getVisibleFaqItems,
  getAllFaqItems,
} from './faq'

export {
  getPublishedTestimonials,
  getFeaturedTestimonials,
  getAllTestimonials,
} from './testimonials'

export {
  getDayAvailability,
  getReservations,
  getReservationById,
  getReservationByToken,
  getReservationHistory,
  createReservation,
  updateReservationStatus,
  cancelReservationByToken,
} from './reservations'

export {
  getEventInquiries,
  getEventInquiryById,
  createEventInquiry,
  updateEventInquiryStatus,
} from './events'

export {
  getContactSubmissions,
  createContactSubmission,
  markContactRead,
} from './contact'
