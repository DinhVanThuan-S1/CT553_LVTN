/**
 * Models Index
 * Export tất cả Mongoose models
 */
module.exports = {
  User: require('./User'),
  CurriculumProgram: require('./CurriculumProgram'),
  Semester: require('./Semester'),
  Course: require('./Course'),
  Skill: require('./Skill'),
  AcademicProfile: require('./AcademicProfile'),
  CareerPreference: require('./CareerPreference'),
  Roadmap: require('./Roadmap'),
  PersonalRoadmap: require('./PersonalRoadmap'),
  SkillTest: require('./SkillTest'),
  RoadmapReview: require('./RoadmapReview'),
  JobTemplate: require('./JobTemplate'),
  Company: require('./Company'),
  CompanyAddress: require('./CompanyAddress'),
  JobPosting: require('./JobPosting'),
  CV: require('./CV'),
  Application: require('./Application'),
  Favorite: require('./Favorite'),
  Conversation: require('./Conversation'),
  Message: require('./Message'),
  Notification: require('./Notification'),
};
