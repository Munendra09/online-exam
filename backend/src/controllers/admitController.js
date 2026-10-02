const { Exam, ExamAssignment } = require('../models');

function cleanTime(time) {
  if (!time) return null;
  return String(time).slice(0, 8);
}

exports.myAdmitCard = async (req, res) => {
  try {
    const exam = await Exam.findByPk(req.params.examId);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found',
      });
    }

    const assignment = await ExamAssignment.findOne({
      where: {
        examId: exam.id,
        userId: req.user.id,
      },
    });

    if (!assignment) {
      return res.status(403).json({
        success: false,
        message: 'This exam is not assigned to you.',
      });
    }

    if (!assignment.admitCardReleased || !assignment.rollNumber) {
      return res.status(403).json({
        success: false,
        message: 'Admit card not released yet. Check back later.',
      });
    }

    return res.json({
      success: true,
      admitCard: {
        id: assignment.id,
        rollNumber: assignment.rollNumber,

        // assignment-specific shift data
        shiftName: assignment.shiftName,
        shiftNumber: assignment.shiftNumber,
        shiftDayIndex: assignment.shiftDayIndex,
        assignedDate: assignment.assignedDate,
        startTime: cleanTime(assignment.startTime),
        endTime: cleanTime(assignment.endTime),

        releaseStatus: true,

        student: {
          id: req.user.id,
          name: req.user.name,
          email: req.user.email,
          mobile: req.user.mobile,
          className: req.user.className,
          fatherName: req.user.fatherName,
          dob: req.user.dob,
          registrationId: req.user.registrationId,
          photo: req.user.photo,
        },

        exam: {
          id: exam.id,
          title: exam.title,
          className: exam.targetClasses,
          date: exam.date,
          shiftName: exam.shiftName,
          startTime: cleanTime(exam.startTime),
          endTime: cleanTime(exam.endTime),
          duration: exam.duration,
          examCenter: exam.examCenter,
          totalQuestions: exam.totalQuestions,
        },
      },
    });
  } catch (err) {
    console.error('Admit card error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to load admit card',
    });
  }
};