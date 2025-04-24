/**
 * Airtable API Integration for Website Builder Landing
 * This file handles all interactions with the Airtable API for scheduling functionality
 */

// Airtable API Configuration
const AIRTABLE_API_KEY = 'patL0F9YdbXx4vbso.27b65cab30ecf0c1b2a6d0ff89c49cdfb2c9741b2c4e0c98c193af5b0f43cc65'; // API key for time slots
const AIRTABLE_BASE_ID = 'appoYMWjIXw9G9veZ'; // Base ID for time slots
const AIRTABLE_TABLE_NAME = 'tblAlLhgYAP8yS4ic'; // Table ID for time slots

// Bookings table configuration
const AIRTABLE_BOOKINGS_API_KEY = 'patq4GlusEvwjDjEd.0eb5e7bd3cc698491784af2b5908974996f1a93a810e74df8e4aa0c2696e9a49'; // API key for bookings
const AIRTABLE_BOOKINGS_BASE_ID = 'app8enzqvKC1x01nV'; // Base ID for bookings
const AIRTABLE_BOOKINGS_TABLE = 'tblgQNf3f9OCtavRw'; // Table ID for bookings

// API Endpoints
const AIRTABLE_SLOTS_API_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`;
const AIRTABLE_BOOKINGS_API_URL = `https://api.airtable.com/v0/${AIRTABLE_BOOKINGS_BASE_ID}`;

// Local Storage Keys (using the same keys as script.js but not redeclaring them)
// These are already declared in script.js, so we'll use them without redeclaring
// const SLOTS_STORAGE_KEY = 'booking_available_slots';
// const BOOKINGS_STORAGE_KEY = 'bookingSubmissions';

/**
 * Fetch available time slots from Airtable
 * @returns {Promise<Array>} Array of time slot ISO strings
 */
async function fetchAvailableSlots() {
    try {
        const response = await fetch(`${AIRTABLE_SLOTS_API_URL}/${AIRTABLE_TABLE_NAME}?filterByFormula=NOT({Booked})`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Airtable API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        // Extract the datetime values and convert to ISO strings
        const availableSlots = data.records.map(record => {
            return {
                id: record.id,
                datetime: record.fields.DateTime // Assuming your field is called "DateTime"
            };
        });

        // Store in localStorage for offline access
        const slotDatetimes = availableSlots.map(slot => slot.datetime);
        localStorage.setItem('booking_available_slots', JSON.stringify(slotDatetimes));
        
        // Also store the mapping of ISO strings to record IDs for later use
        localStorage.setItem('airtable_slot_ids', JSON.stringify(
            availableSlots.reduce((map, slot) => {
                map[slot.datetime] = slot.id;
                return map;
            }, {})
        ));

        return slotDatetimes;
    } catch (error) {
        console.error('Error fetching available slots from Airtable:', error);
        
        // Fallback to localStorage if API call fails
        const storedSlots = localStorage.getItem('booking_available_slots');
        return storedSlots ? JSON.parse(storedSlots) : [];
    }
}

/**
 * Create a new time slot in Airtable
 * @param {string} datetimeISO - ISO string of the date and time
 * @returns {Promise<Object>} The created record
 */
async function createTimeSlot(datetimeISO) {
    try {
        const response = await fetch(`${AIRTABLE_SLOTS_API_URL}/${AIRTABLE_TABLE_NAME}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                records: [
                    {
                        fields: {
                            DateTime: datetimeISO,
                            Booked: false
                        }
                    }
                ]
            })
        });

        if (!response.ok) {
            throw new Error(`Airtable API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        // Update local storage with the new slot
        updateLocalStorageWithNewSlot(datetimeISO, data.records[0].id);
        
        return data.records[0];
    } catch (error) {
        console.error('Error creating time slot in Airtable:', error);
        throw error;
    }
}

/**
 * Delete a time slot from Airtable
 * @param {string} datetimeISO - ISO string of the date and time to delete
 * @returns {Promise<boolean>} Success status
 */
async function deleteTimeSlot(datetimeISO) {
    try {
        // Get the Airtable record ID for this datetime
        const slotIdMap = JSON.parse(localStorage.getItem('airtable_slot_ids') || '{}');
        const recordId = slotIdMap[datetimeISO];
        
        if (!recordId) {
            throw new Error(`No record ID found for datetime: ${datetimeISO}`);
        }
        
        const response = await fetch(`${AIRTABLE_SLOTS_API_URL}/${AIRTABLE_TABLE_NAME}/${recordId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Airtable API error: ${response.status} ${response.statusText}`);
        }

        // Update local storage by removing the deleted slot
        removeSlotFromLocalStorage(datetimeISO);
        
        return true;
    } catch (error) {
        console.error('Error deleting time slot from Airtable:', error);
        throw error;
    }
}

/**
 * Book a time slot in Airtable (mark as booked and create booking record)
 * @param {Object} bookingData - The booking form data
 * @returns {Promise<Object>} The created booking record
 */
async function createBooking(bookingData) {
    try {
        // 1. First, mark the time slot as booked
        const slotIdMap = JSON.parse(localStorage.getItem('airtable_slot_ids') || '{}');
        const slotRecordId = slotIdMap[bookingData.bookedSlotISO];
        
        if (!slotRecordId) {
            throw new Error(`No record ID found for datetime: ${bookingData.bookedSlotISO}`);
        }
        
        const updateSlotResponse = await fetch(`${AIRTABLE_SLOTS_API_URL}/${AIRTABLE_TABLE_NAME}/${slotRecordId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fields: {
                    Booked: true
                }
            })
        });

        if (!updateSlotResponse.ok) {
            throw new Error(`Airtable API error updating slot: ${updateSlotResponse.status} ${updateSlotResponse.statusText}`);
        }

        // 2. Then, create a booking record
        const createBookingResponse = await fetch(`${AIRTABLE_BOOKINGS_API_URL}/${AIRTABLE_BOOKINGS_TABLE}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AIRTABLE_BOOKINGS_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                records: [
                    {
                        fields: {
                            SlotID: slotRecordId,
                            DateTime: bookingData.bookedSlotISO,
                            CallType: bookingData.callType,
                            FirstName: bookingData.firstName,
                            LastName: bookingData.lastName,
                            Email: bookingData.email,
                            Company: bookingData.company || '',
                            Phone: bookingData.phone || '',
                            Notes: bookingData.notes || '',
                            SubmissionTimestamp: bookingData.submissionTimestamp,
                            Package: bookingData.package || ''
                        }
                    }
                ]
            })
        });

        if (!createBookingResponse.ok) {
            throw new Error(`Airtable API error creating booking: ${createBookingResponse.status} ${createBookingResponse.statusText}`);
        }

        const bookingData = await createBookingResponse.json();
        
        // Update local storage
        updateLocalStorageWithBooking(bookingData);
        
        return bookingData.records[0];
    } catch (error) {
        console.error('Error creating booking in Airtable:', error);
        throw error;
    }
}

/**
 * Cancel a booking in Airtable
 * @param {string} bookingId - The Airtable record ID of the booking
 * @param {string} slotId - The Airtable record ID of the time slot
 * @returns {Promise<boolean>} Success status
 */
async function cancelBooking(bookingId, slotId) {
    try {
        // 1. Delete the booking record
        const deleteBookingResponse = await fetch(`${AIRTABLE_BOOKINGS_API_URL}/${AIRTABLE_BOOKINGS_TABLE}/${bookingId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${AIRTABLE_BOOKINGS_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!deleteBookingResponse.ok) {
            throw new Error(`Airtable API error deleting booking: ${deleteBookingResponse.status} ${deleteBookingResponse.statusText}`);
        }

        // 2. Mark the time slot as available again
        const updateSlotResponse = await fetch(`${AIRTABLE_SLOTS_API_URL}/${AIRTABLE_TABLE_NAME}/${slotId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fields: {
                    Booked: false
                }
            })
        });

        if (!updateSlotResponse.ok) {
            throw new Error(`Airtable API error updating slot: ${updateSlotResponse.status} ${updateSlotResponse.statusText}`);
        }

        return true;
    } catch (error) {
        console.error('Error canceling booking in Airtable:', error);
        throw error;
    }
}

/**
 * Fetch all bookings from Airtable
 * @returns {Promise<Array>} Array of booking objects
 */
async function fetchBookings() {
    try {
        const response = await fetch(`${AIRTABLE_BOOKINGS_API_URL}/${AIRTABLE_BOOKINGS_TABLE}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${AIRTABLE_BOOKINGS_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Airtable API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        // Convert Airtable records to the format used in the application
        const bookings = data.records.map(record => {
            return {
                id: record.id,
                bookedSlotISO: record.fields.DateTime,
                callType: record.fields.CallType,
                firstName: record.fields.FirstName,
                lastName: record.fields.LastName,
                email: record.fields.Email,
                company: record.fields.Company || '',
                phone: record.fields.Phone || '',
                notes: record.fields.Notes || '',
                submissionTimestamp: record.fields.SubmissionTimestamp,
                package: record.fields.Package || '',
                slotId: record.fields.SlotID
            };
        });

        // Store in localStorage for offline access
        localStorage.setItem('bookingSubmissions', JSON.stringify(bookings));
        
        return bookings;
    } catch (error) {
        console.error('Error fetching bookings from Airtable:', error);
        
        // Fallback to localStorage if API call fails
        const storedBookings = localStorage.getItem('bookingSubmissions');
        return storedBookings ? JSON.parse(storedBookings) : [];
    }
}

// Helper functions for localStorage management

function updateLocalStorageWithNewSlot(datetimeISO, recordId) {
    // Update available slots
    const storedSlots = JSON.parse(localStorage.getItem('booking_available_slots') || '[]');
    if (!storedSlots.includes(datetimeISO)) {
        storedSlots.push(datetimeISO);
        storedSlots.sort();
        localStorage.setItem('booking_available_slots', JSON.stringify(storedSlots));
    }
    
    // Update ID mapping
    const slotIdMap = JSON.parse(localStorage.getItem('airtable_slot_ids') || '{}');
    slotIdMap[datetimeISO] = recordId;
    localStorage.setItem('airtable_slot_ids', JSON.stringify(slotIdMap));
}

function removeSlotFromLocalStorage(datetimeISO) {
    // Remove from available slots
    const storedSlots = JSON.parse(localStorage.getItem('booking_available_slots') || '[]');
    const updatedSlots = storedSlots.filter(slot => slot !== datetimeISO);
    localStorage.setItem('booking_available_slots', JSON.stringify(updatedSlots));
    
    // Remove from ID mapping
    const slotIdMap = JSON.parse(localStorage.getItem('airtable_slot_ids') || '{}');
    delete slotIdMap[datetimeISO];
    localStorage.setItem('airtable_slot_ids', JSON.stringify(slotIdMap));
}

function updateLocalStorageWithBooking(bookingData) {
    // Add to bookings
    const storedBookings = JSON.parse(localStorage.getItem('bookingSubmissions') || '[]');
    storedBookings.push(bookingData);
    localStorage.setItem('bookingSubmissions', JSON.stringify(storedBookings));
    
    // Remove from available slots
    const storedSlots = JSON.parse(localStorage.getItem('booking_available_slots') || '[]');
    const updatedSlots = storedSlots.filter(slot => slot !== bookingData.bookedSlotISO);
    localStorage.setItem('booking_available_slots', JSON.stringify(updatedSlots));
}

// Export functions for use in other files
window.AirtableAPI = {
    fetchAvailableSlots,
    createTimeSlot,
    deleteTimeSlot,
    createBooking,
    cancelBooking,
    fetchBookings
};
