/**
 * CareerPreference Service
 * Sở thích nghề nghiệp
 */
const CareerPreference = require('../models/CareerPreference');

class CareerPreferenceService {
  async getPreference(studentId) {
    let pref = await CareerPreference.findOne({ student: studentId });
    if (!pref) {
      pref = await CareerPreference.create({ student: studentId });
    }
    return pref;
  }

  async updatePreference(studentId, data) {
    const pref = await CareerPreference.findOneAndUpdate(
      { student: studentId },
      {
        careerPaths: data.careerPaths || [],
        preferredLocations: data.preferredLocations || [],
        expectedSalary: data.expectedSalary || { min: 0, max: 0 },
        jobTypes: data.jobTypes || [],
        interestedCompanies: data.interestedCompanies || [],
        notes: data.notes || '',
      },
      { new: true, upsert: true, runValidators: true }
    );
    return pref;
  }
}

module.exports = new CareerPreferenceService();
