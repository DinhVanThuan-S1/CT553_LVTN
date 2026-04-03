/**
 * Learning Controller
 * Xử lý buổi học, bài test kỹ năng, đánh giá lộ trình
 */
const PersonalRoadmap = require('../models/PersonalRoadmap');
const Skill = require('../models/Skill');
const Resource = require('../models/Resource');
const RoadmapReview = require('../models/RoadmapReview');

/**
 * Lấy chi tiết buổi học — lấy resources từ Resource collection
 * GET /api/student/my-roadmaps/:prId/sessions/:sessionId
 */
exports.getSessionDetail = async (req, res) => {
  try {
    const pr = await PersonalRoadmap.findOne({
      _id: req.params.prId,
      student: req.user._id,
    });
    if (!pr) return res.status(404).json({ message: 'Không tìm thấy lộ trình' });

    const session = pr.sessions.id(req.params.sessionId);
    if (!session) return res.status(404).json({ message: 'Không tìm thấy buổi học' });

    // Lấy skill + populate linkedResources từ Resource collection
    const skill = await Skill.findById(session.skill)
      .populate({
        path: 'linkedResources',
        match: { isActive: { $ne: false } },
        select: 'title description type category url content difficulty estimatedMinutes testQuestions tags',
      });
    if (!skill) return res.status(404).json({ message: 'Không tìm thấy kỹ năng' });

    // Phân loại resources theo type
    const allResources = skill.linkedResources || [];
    const contentResources = allResources.filter(r => r.type === 'content');
    const exerciseResources = allResources.filter(r => r.type === 'exercise');
    const testResources = allResources.filter(r => r.type === 'test');

    // Đếm sessions cho skill
    const skillSessions = pr.sessions.filter(
      (s) => String(s.skill) === String(skill._id)
    );
    const completedCount = skillSessions.filter((s) => s.status === 'completed').length;
    const totalCount = skillSessions.length;

    res.json({
      data: {
        session: {
          _id: session._id,
          date: session.date,
          startTime: session.startTime,
          endTime: session.endTime,
          status: session.status,
          notes: session.notes,
          completedAt: session.completedAt,
        },
        skill: {
          _id: skill._id,
          name: skill.name,
          icon: skill.icon,
          category: skill.category,
          description: skill.description,
          estimatedHours: skill.estimatedHours,
          resources: contentResources,
          exercises: exerciseResources,
          testResources: testResources,
        },
        progress: {
          completed: completedCount,
          total: totalCount,
          percentage: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
        },
      },
    });
  } catch (error) {
    console.error('getSessionDetail error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

/**
 * Cập nhật ghi chú buổi học
 * PATCH /api/student/my-roadmaps/:prId/sessions/:sessionId/notes
 */
exports.updateSessionNotes = async (req, res) => {
  try {
    const pr = await PersonalRoadmap.findOne({
      _id: req.params.prId,
      student: req.user._id,
    });
    if (!pr) return res.status(404).json({ message: 'Không tìm thấy lộ trình' });

    const session = pr.sessions.id(req.params.sessionId);
    if (!session) return res.status(404).json({ message: 'Không tìm thấy buổi học' });

    session.notes = req.body.notes || '';
    await pr.save();

    res.json({ data: session, message: 'Đã lưu ghi chú' });
  } catch (error) {
    console.error('updateSessionNotes error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

/**
 * Nộp bài test kỹ năng — lấy questions từ Resource collection
 * POST /api/student/my-roadmaps/:prId/skills/:skillId/test
 * Body: { answers: [{ questionId, selectedOption }] }
 */
exports.submitSkillTest = async (req, res) => {
  try {
    const { answers } = req.body;
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ message: 'Dữ liệu không hợp lệ' });
    }

    const pr = await PersonalRoadmap.findOne({
      _id: req.params.prId,
      student: req.user._id,
    });
    if (!pr) return res.status(404).json({ message: 'Không tìm thấy lộ trình' });

    const skill = await Skill.findById(req.params.skillId);
    if (!skill) return res.status(404).json({ message: 'Không tìm thấy kỹ năng' });

    // Lấy testQuestions từ Resource collection
    const testResources = await Resource.find({
      _id: { $in: skill.linkedResources || [] },
      type: 'test',
      isActive: { $ne: false },
    });

    // Gom tất cả câu hỏi — dùng composite key vì option không có _id
    const allQuestions = [];
    testResources.forEach(r => {
      (r.testQuestions || []).forEach((q, qi) => {
        allQuestions.push({
          _id: `${r._id}_${qi}`,
          question: q.question,
          explanation: q.explanation,
          options: q.options,          // giữ nguyên để có isCorrect
          correctOptionIndex: q.options.findIndex(o => o.isCorrect),
        });
      });
    });

    if (allQuestions.length === 0) {
      return res.status(400).json({ message: 'Kỹ năng chưa có câu hỏi test' });
    }

    // Chấm điểm — selectedOption là optionIndex (string)
    let correct = 0;
    const results = answers.map((ans) => {
      const question = allQuestions.find(q => q._id === String(ans.questionId));
      if (!question) return { questionId: ans.questionId, correct: false };

      const selectedIdx = Number(ans.selectedOption);
      const isCorrect = question.correctOptionIndex >= 0 && selectedIdx === question.correctOptionIndex;
      if (isCorrect) correct++;

      const correctOption = question.options[question.correctOptionIndex];
      return {
        questionId: ans.questionId,
        question: question.question,
        selectedOption: ans.selectedOption,
        correct: isCorrect,
        explanation: question.explanation,
        correctAnswer: correctOption?.text,
      };
    });

    const total = allQuestions.length;
    const score = Math.round((correct / total) * 100);
    const passed = score >= 60;

    // Nếu đạt → hoàn thành sessions còn upcoming
    if (passed) {
      let anyUpdated = false;
      pr.sessions.forEach((s) => {
        if (String(s.skill) === String(skill._id) && s.status === 'upcoming') {
          s.status = 'completed';
          s.completedAt = new Date();
          anyUpdated = true;
        }
      });
      if (anyUpdated) {
        const totalSessions = pr.sessions.length;
        const completedSessions = pr.sessions.filter((s) => s.status === 'completed').length;
        pr.progress = Math.round((completedSessions / totalSessions) * 100);
        pr.totalHoursLearned = completedSessions * 2;
        if (pr.progress === 100) pr.status = 'completed';
        await pr.save();
      }
    }

    res.json({
      data: {
        score,
        correct,
        total,
        passed,
        results,
        message: passed
          ? `🎉 Chúc mừng! Bạn đạt ${score}% — Kỹ năng "${skill.name}" đã hoàn thành!`
          : `Bạn đạt ${score}%. Cần >= 60% để hoàn thành kỹ năng. Hãy thử lại!`,
      },
    });
  } catch (error) {
    console.error('submitSkillTest error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

/**
 * Lấy câu hỏi test cho skill — từ Resource collection
 * GET /api/student/my-roadmaps/:prId/skills/:skillId/test
 */
exports.getSkillTest = async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.skillId);
    if (!skill) return res.status(404).json({ message: 'Không tìm thấy kỹ năng' });

    // Lấy testQuestions từ Resource collection
    const testResources = await Resource.find({
      _id: { $in: skill.linkedResources || [] },
      type: 'test',
      isActive: { $ne: false },
    });

    const questions = [];
    testResources.forEach(r => {
      (r.testQuestions || []).forEach((q, qi) => {
        questions.push({
          _id: `${r._id}_${qi}`,   // composite ID vì testQuestion có _id nhưng option không có
          question: q.question,
          difficulty: q.difficulty,
          options: q.options.map((opt, oi) => ({
            optionIndex: oi,          // dùng index thay vì _id (options schema có _id:false)
            text: opt.text,
          })),
        });
      });
    });

    if (questions.length === 0) {
      return res.status(404).json({ message: 'Chưa có bài test cho kỹ năng này' });
    }

    res.json({
      data: {
        skill: { _id: skill._id, name: skill.name, icon: skill.icon },
        questions,
        totalQuestions: questions.length,
        passingScore: 60,
      },
    });
  } catch (error) {
    console.error('getSkillTest error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};


/**
 * Đánh giá lộ trình (sao + nhận xét)
 * POST /api/student/roadmaps/:roadmapId/reviews
 */
exports.createReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Điểm đánh giá 1-5 là bắt buộc' });
    }

    // Upsert — SV chỉ đánh giá 1 lần/lộ trình
    const review = await RoadmapReview.findOneAndUpdate(
      { student: req.user._id, roadmap: req.params.roadmapId },
      { rating, comment: comment || '' },
      { upsert: true, new: true, runValidators: true },
    );

    // Trigger post save hook (update averageRating trên Roadmap)
    await review.save();

    res.json({ data: review, message: 'Cảm ơn đánh giá của bạn!' });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Bạn đã đánh giá lộ trình này rồi' });
    }
    console.error('createReview error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

/**
 * Lấy reviews của lộ trình
 * GET /api/roadmaps/:roadmapId/reviews
 */
exports.getRoadmapReviews = async (req, res) => {
  try {
    const reviews = await RoadmapReview.find({ roadmap: req.params.roadmapId })
      .populate('student', 'fullName avatar')
      .sort('-createdAt')
      .limit(50);

    const myReview = req.user
      ? await RoadmapReview.findOne({ student: req.user._id, roadmap: req.params.roadmapId })
      : null;

    res.json({ data: reviews, myReview });
  } catch (error) {
    console.error('getRoadmapReviews error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};
