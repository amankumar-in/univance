const Student = require("../models/student.model");
const Parent = require("../models/parent.model");
const Teacher = require("../models/teacher.model");
const User = require("../models/user.model");
const Badge = require("../models/badge.model");
const SchoolClass = require("../models/schoolClass.model");
const LinkRequest = require("../models/linkRequest.model");
const linkRequestController = require("./linkRequest.controller");
const crypto = require("crypto");
const axios = require("axios");
const { default: mongoose } = require("mongoose");

// Get student profile (for student users)
exports.getStudentProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const student = await Student.aggregate([
      {
        $match: {
          userId: mongoose.Types.ObjectId.createFromHexString(userId),
        },
      },
      // Look up parents information
      {
        $lookup: {
          from: "parents",
          localField: "parentIds",
          foreignField: "_id",
          as: "parentIds",
          pipeline: [
            {
              $project: {
                _id: 1,
                userId: 1,
              },
            },
            {
              $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "userDetails",
              },
            },
            {
              $unwind: {
                path: "$userDetails",
                preserveNullAndEmptyArrays: true
              }
            },
            {
              $project: {
                userId: 1,
                firstName: "$userDetails.firstName",
                lastName: "$userDetails.lastName",
                email: "$userDetails.email",
                avatar: "$userDetails.avatar",
              }
            }
          ]
        },
      },
      {
        $lookup: {
          from: "schools",
          localField: "schoolId",
          foreignField: "_id",
          as: "schoolId",
          pipeline: [
            {
              $project: {
                adminIds: 0,
              }
            }
          ]
        }
      },
      {
        $lookup: {
          from: "teachers",
          localField: "teacherIds",
          foreignField: "_id",
          as: "teacherIds",
          pipeline: [
            {
              $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "userDetails",
              }
            },
            {
              $unwind: {
                path: "$userDetails",
                preserveNullAndEmptyArrays: true
              }
            },
            {
              $project: {
                userId: 1,
                firstName: "$userDetails.firstName",
                lastName: "$userDetails.lastName",
                email: "$userDetails.email",
                avatar: "$userDetails.avatar",
                subjectsTaught: 1,
              }
            }
          ]
        },
      },
      {
        $addFields: {
          schoolDetails: {
            $arrayElemAt: ["$schoolId", 0]
          },
        }
      },
      {
        $project: {
          schoolId: 0,
        }
      }
    ])

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    res.status(200).json({
      success: true,
      data: student[0],
    });
  } catch (error) {
    console.error("Get student profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get student profile",
      error: error.message,
    });
  }
};

// Get student by ID
exports.getStudentById = async (req, res) => {
  try {
    const studentId = req.params.id;

    const student = await Student.findById(studentId)
      .populate("userId", "firstName lastName email avatar dateOfBirth")
      .populate("parentIds", "userId firstName lastName")
      .populate("teacherIds", "userId firstName lastName");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    res.status(200).json({
      success: true,
      data: student,
    });
  } catch (error) {
    console.error("Get student by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get student",
      error: error.message,
    });
  }
};

// Create student profile
exports.createStudentProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { grade, schoolId } = req.body;

    // Check if student profile already exists
    const existingStudent = await Student.findOne({ userId });
    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: "Student profile already exists",
      });
    }

    // Generate a temporary pointsAccountId (will be replaced by points service later)
    const tempPointsAccountId = `temp_${crypto
      .randomBytes(10)
      .toString("hex")}`;

    // Create new student profile
    const newStudent = new Student({
      userId,
      grade,
      schoolId,
      pointsAccountId: tempPointsAccountId,
      level: 1,
      attendanceStreak: 0,
    });

    await newStudent.save();

    // Create a points account for the student
    try {
      const pointsServiceUrl =
        process.env.NODE_ENV === "production"
          ? process.env.PRODUCTION_POINTS_SERVICE_URL
          : process.env.POINTS_SERVICE_URL;

      console.log(
        `Attempting to create points account at: ${pointsServiceUrl}/api/points/accounts`
      );

      const response = await axios.post(
        `${pointsServiceUrl}/api/points/accounts`,
        {
          studentId: newStudent._id.toString(),
        },
        {
          headers: {
            Authorization: req.headers.authorization,
          },
        }
      );

      console.log(
        `Points account created for student ${newStudent._id}:`,
        response.data
      );
    } catch (error) {
      console.error("Failed to create points account:", error.message);
      if (error.response) {
        console.error("Response details:", error.response.data);
      }
      // Continue even if points account creation fails initially
    }

    res.status(201).json({
      success: true,
      message: "Student profile created successfully",
      data: newStudent,
    });
  } catch (error) {
    console.error("Create student profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create student profile",
      error: error.message,
    });
  }
};

// Update the linkWithParent method
exports.linkWithParent = async (req, res) => {
  try {
    const userId = req.user.id;
    const { parentLinkCode } = req.body;

    if (!parentLinkCode) {
      return res.status(400).json({
        success: false,
        message: "Parent link code is required",
      });
    }

    // Find student
    const student = await Student.findOne({ userId });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    // Find parent with link code
    const parent = await Parent.findOne({ linkCode: parentLinkCode });
    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Invalid parent link code",
      });
    }

    // Check if already linked
    if (student.parentIds.includes(parent._id)) {
      return res.status(400).json({
        success: false,
        message: "Already linked with this parent",
      });
    }

    // Link parent to student
    student.parentIds.push(parent._id);
    await student.save();

    // Link student to parent
    if (!parent.childIds.includes(student._id)) {
      parent.childIds.push(student._id);
      await parent.save();
    }

    res.status(200).json({
      success: true,
      message: "Successfully linked with parent",
      data: {
        parentId: parent._id,
      },
    });
  } catch (error) {
    console.error("Link with parent error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to link with parent",
      error: error.message,
    });
  }
};

// Get student badges
exports.getStudentBadges = async (req, res) => {
  try {
    const studentId = req.params.id;

    // Find student
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Get badges
    const badges = await Badge.find({
      _id: { $in: student.badges },
    });

    res.status(200).json({
      success: true,
      data: badges,
    });
  } catch (error) {
    console.error("Get student badges error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get student badges",
      error: error.message,
    });
  }
};

// Get student level and progress
exports.getStudentLevel = async (req, res) => {
  try {
    const studentId = req.params.id;

    // Find student
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // This would normally call the points-service API
    res.status(200).json({
      success: true,
      data: {
        level: student.level,
        // Points data will come from points-service later
        currentPoints: 0,
        pointsNeededForNextLevel: 100,
        progressPercentage: 0,
      },
    });
  } catch (error) {
    console.error("Get student level error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get student level",
      error: error.message,
    });
  }
};

// Link with school
exports.linkWithSchool = async (req, res) => {
  try {
    const userId = req.user.id;
    const { schoolCode } = req.body;

    if (!schoolCode) {
      return res.status(400).json({
        success: false,
        message: "School join code is required",
      });
    }

    // Find student
    const student = await Student.findOne({ userId });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    // Find class with join code
    const schoolClass = await SchoolClass.findOne({ joinCode: schoolCode });
    if (!schoolClass) {
      return res.status(404).json({
        success: false,
        message: "Invalid school code",
      });
    }

    // Update student with school and class
    student.schoolId = schoolClass.schoolId;

    // Add student to class if not already added
    if (!schoolClass.studentIds.includes(student._id)) {
      schoolClass.studentIds.push(student._id);
      await schoolClass.save();
    }

    // Add teacher to student's teachers if not already added
    if (
      schoolClass.teacherId &&
      !student.teacherIds.includes(schoolClass.teacherId)
    ) {
      student.teacherIds.push(schoolClass.teacherId);
    }

    await student.save();

    res.status(200).json({
      success: true,
      message: "Successfully linked with school",
      data: {
        schoolId: schoolClass.schoolId,
        classId: schoolClass._id,
      },
    });
  } catch (error) {
    console.error("Link with school error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to link with school",
      error: error.message,
    });
  }
};

// Add this controller function
// Update student's points account ID
exports.updatePointsAccount = async (req, res) => {
  try {
    const studentId = req.params.id;
    const { pointsAccountId } = req.body;

    if (!pointsAccountId) {
      return res.status(400).json({
        success: false,
        message: "Points account ID is required",
      });
    }

    // Update the student with the points account ID
    const student = await Student.findByIdAndUpdate(
      studentId,
      { pointsAccountId },
      { new: true }
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Points account ID updated successfully",
      data: {
        studentId,
        pointsAccountId,
      },
    });
  } catch (error) {
    console.error("Update points account ID error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update points account ID",
      error: error.message,
    });
  }
};

// Unlink student from parent
exports.unlinkFromParent = async (req, res) => {
  try {
    const studentId = req.params.id;
    const { parentId } = req.params;

    // Find student
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Check permissions
    const isOwnProfile = student.userId.toString() === req.user.id;
    const isAdmin = req.user.roles.includes("platform_admin");
    const isParent = req.user.roles.includes("parent");

    // Only allow student themselves, admin, or the parent to unlink
    if (
      !isOwnProfile &&
      !isAdmin &&
      (!isParent || !student.parentIds.includes(parentId))
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to unlink this relationship",
      });
    }

    // Check if parent exists in student's parents
    if (!student.parentIds.includes(parentId)) {
      return res.status(400).json({
        success: false,
        message: "Parent is not linked to this student",
      });
    }

    // Remove parent from student
    student.parentIds = student.parentIds.filter(
      (id) => id.toString() !== parentId
    );
    await student.save();

    // Remove student from parent
    const parent = await Parent.findById(parentId);
    if (parent) {
      parent.childIds = parent.childIds.filter(
        (id) => id.toString() !== studentId
      );
      await parent.save();
    }

    // Create relationship history record
    // This would be implemented if you have a relationship history model

    res.status(200).json({
      success: true,
      message: "Successfully unlinked student from parent",
    });
  } catch (error) {
    console.error("Unlink from parent error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to unlink student from parent",
      error: error.message,
    });
  }
};

// Unlink student from school
exports.unlinkFromSchool = async (req, res) => {
  try {
    const studentId = req.params.id;

    // Find student
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Check permissions
    const isOwnProfile = student.userId.toString() === req.user.id;
    const isAdmin = req.user.roles.includes("platform_admin");
    const isSchoolAdmin = req.user.roles.includes("school_admin");

    // Only allow student themselves, platform admin, or school admin to unlink
    if (
      !isOwnProfile &&
      !isAdmin &&
      (!isSchoolAdmin || !req.user.schoolId === student.schoolId)
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to unlink from school",
      });
    }

    // Check if student is linked to a school
    if (!student.schoolId) {
      return res.status(400).json({
        success: false,
        message: "Student is not linked to any school",
      });
    }

    const schoolId = student.schoolId;

    // Remove student from all classes in the school
    const classes = await SchoolClass.find({ schoolId, studentIds: studentId });
    for (const cls of classes) {
      cls.studentIds = cls.studentIds.filter(
        (id) => id.toString() !== studentId
      );
      await cls.save();
    }

    // Remove teachers from student
    // We need to be careful here as a teacher might be associated with multiple classes
    // Only remove teachers that are exclusively from this school
    const teachersToKeep = [];
    for (const teacherId of student.teacherIds) {
      const teacher = await Teacher.findById(teacherId);
      if (teacher && teacher.schoolId.toString() !== schoolId.toString()) {
        teachersToKeep.push(teacherId);
      }
    }
    student.teacherIds = teachersToKeep;

    // Clear school ID
    student.schoolId = null;
    await student.save();

    // Create relationship history record
    // This would be implemented if you have a relationship history model

    res.status(200).json({
      success: true,
      message: "Successfully unlinked student from school",
    });
  } catch (error) {
    console.error("Unlink from school error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to unlink student from school",
      error: error.message,
    });
  }
};
// Update student profile
exports.updateStudentProfile = async (req, res) => {
  try {
    const studentId = req.params.id;
    const { grade, level } = req.body;

    // Check permissions
    const isOwnProfile = req.user.id === studentId;
    const isAdmin = req.user.roles.includes("platform_admin");
    const isParent = req.user.roles.includes("parent");

    // Only allow the student themselves, admin, or the parent to update
    if (!isOwnProfile && !isAdmin && !isParent) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this profile",
      });
    }

    // Find and update student
    const updatedStudent = await Student.findByIdAndUpdate(
      studentId,
      {
        grade: grade !== undefined ? grade : undefined,
        level: level !== undefined ? level : undefined,
        updatedAt: Date.now(),
      },
      { new: true }
    );

    if (!updatedStudent) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Student profile updated successfully",
      data: updatedStudent,
    });
  } catch (error) {
    console.error("Update student profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update student profile",
      error: error.message,
    });
  }
};

// Request link with parent (simplified version for direct use)
exports.requestParentLink = async (req, res) => {
  try {
    const userId = req.user.id;
    const { parentEmail } = req.body;

    if (!parentEmail) {
      return res.status(400).json({
        success: false,
        message: "Parent email is required",
      });
    }

    // Forward to link request controller
    const linkRequestController = require("./linkRequest.controller");
    return linkRequestController.requestParentLink(req, res);
  } catch (error) {
    console.error("Request parent link error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to request parent link",
      error: error.message,
    });
  }
};

// Request link with school (simplified version)
exports.requestSchoolLink = async (req, res) => {
  try {
    const userId = req.user.id;
    const { schoolCode } = req.body;

    if (!schoolCode) {
      return res.status(400).json({
        success: false,
        message: "School code is required",
      });
    }

    // Forward to link request controller
    const linkRequestController = require("./linkRequest.controller");
    return linkRequestController.requestSchoolLink(req, res);
  } catch (error) {
    console.error("Request school link error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to request school link",
      error: error.message,
    });
  }
};

// Get student by userId
exports.getStudentByUserId = async (req, res) => {
  try {
    const userId = req.params.userId;

    const student = await Student.findOne({ userId })
      .populate("userId", "firstName lastName email avatar dateOfBirth")
      .populate("parentIds", "userId firstName lastName")
      .populate("teacherIds", "userId firstName lastName");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    res.status(200).json({
      success: true,
      data: student,
    });
  } catch (error) {
    console.error("Get student by userId error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get student",
      error: error.message,
    });
  }
};

// Get parent link requests for student
exports.getParentLinkRequests = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find student
    const student = await Student.findOne({ userId });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    // Find pending link requests where this student is the target and parent is the initiator
    const requests = await LinkRequest.find({
      targetId: student._id,
      requestType: "parent",
      initiator: "parent",
      status: "pending",
    });

    // We need to find the parent information for each request
    const formattedRequests = [];
    for (const request of requests) {
      try {
        // Get parent information (initiator)
        const parent = await Parent.findById(request.initiatorId).populate('userId', 'firstName lastName email avatar');
        
        const parentUser = parent?.userId;

        formattedRequests.push({
          _id: request._id,
          parentName: parentUser ? `${parentUser.firstName} ${parentUser.lastName}` : "Unknown",
          parentEmail: parentUser ? parentUser.email : (request.targetEmail || "Unknown"),
          parentAvatar: parentUser?.avatar || null,
          code: request.code,
          createdAt: request.createdAt,
          expiresAt: request.expiresAt
        });
      } catch (err) {
        console.error("Error processing link request:", err);
        // Continue with other requests
      }
    }

    res.status(200).json({
      success: true,
      data: formattedRequests,
    });
  } catch (error) {
    console.error("Get parent link requests error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get parent link requests",
      error: error.message,
    });
  }
};

// Respond to a parent link request
exports.respondToParentLinkRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { requestId } = req.params;
    const { action } = req.body; // "approve" or "reject"

    if (!action || !["approve", "reject"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Action must be either 'approve' or 'reject'",
      });
    }

    // Find student
    const student = await Student.findOne({ userId });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    // Find request
    const request = await LinkRequest.findOne({
      _id: requestId,
      targetId: student._id,
      requestType: "parent",
      initiator: "parent",
      status: "pending",
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Link request not found or already processed",
      });
    }

    // Update request status
    request.status = action === "approve" ? "approved" : "rejected";
    request.updatedAt = Date.now();
    await request.save();

    // If approved, link parent and student
    if (action === "approve") {
      // Get the parent who initiated the request
      const parent = await Parent.findById(request.initiatorId);
      if (!parent) {
        return res.status(404).json({
          success: false,
          message: "Parent not found",
        });
      }

      // Link parent to student
      if (!parent.childIds.includes(student._id)) {
        parent.childIds.push(student._id);
        await parent.save();
      }

      // Link student to parent
      if (!student.parentIds.includes(parent._id)) {
        student.parentIds.push(parent._id);
        await student.save();
      }
    }

    res.status(200).json({
      success: true,
      message: `Link request ${
        action === "approve" ? "approved" : "rejected"
      } successfully`,
    });
  } catch (error) {
    console.error("Respond to parent link request error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to respond to parent link request",
      error: error.message,
    });
  }
};