const express = require('express');
const { Course, Topic, Subtopic } = require('../models');
const validateToken = require('../middleware/validateToken');

const router = express.Router();

// Global Library: all uploaded course materials
router.get('/', validateToken, async (req, res) => {
    try {
        const courses = await Course.findAll({
            include: [
                {
                    model: Topic,
                    as: 'topics',
                    include: [
                        {
                            model: Subtopic,
                            as: 'subtopics',
                        },
                    ],
                },
            ],
            order: [
                ['createdAt', 'DESC'],
                [{ model: Topic, as: 'topics' }, 'createdAt', 'ASC'],
            ],
        });

        const libraryItems = [];

        courses.forEach((course) => {
            (course.topics || []).forEach((topic) => {
                (topic.subtopics || []).forEach((subtopic) => {
                    libraryItems.push({
                        id: subtopic.id,
                        title: subtopic.title,
                        fileUrl: subtopic.fileUrl || '',
                        topicId: topic.id,
                        topicTitle: topic.title,
                        courseId: course.id,
                        courseTitle: course.title,
                    });
                });
            });
        });

        res.json(libraryItems);
    } catch (error) {
        console.error('Global library fetch error:', error);
        res.status(500).json({ message: 'Failed to load library.' });
    }
});

module.exports = router;