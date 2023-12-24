const express = require("express");
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');
const User = require('../../models/User');
const Profile = require('../../models/profile');

// @route   GET api/profile/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async(req, res)=> {
    try {
        const profile = await Profile.findOne({ user : req.user.id }).populate('user', ['name', 'avatar']);
        if(!profile){
            return res.status(400).json({ msg: 'There is no profile for this user'});
        }
        res.send(profile);
    } catch (err) {
        console.log(err.message);
        res.status(500).send('Server Error!');
    }
});


// @route   POST api/profile/
// @desc    Create or update user profile 
// @access  Private
router.post(
    '/',
    [
        auth,
        [
            check('status', 'Status is required').not().isEmpty(),
            check('skills', 'Skills is required').not().isEmpty() 
        ]
    ],
    async (req, res)=>{
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            company,
            website,
            location,
            status, 
            skills,
            bio,
            githubUserName,
            youtube,
            facebook,
            twitter,
            instagram,
            linkedin
        } = req.body;

        // Build user profile
        const profileFields = {};
        profileFields.user= req.user.id;
        if(company) profileFields.company=company;
        if(website) profileFields.website=website;
        if(location) profileFields.location=location;
        if(status) profileFields.status=status;
        if(githubUserName) profileFields.githubUserName=githubUserName;
        if(bio) profileFields.bio=bio;
        if(skills){
            profileFields.skills=skills.split(',').map(skill =>  skill.trim());
        }
        
        // Build social object
        profileFields.social={};
        if(youtube) profileFields.social.youtube=youtube;
        if(facebook) profileFields.social.facebook=facebook;
        if(twitter) profileFields.social.twitter=twitter;
        if(instagram) profileFields.social.instagram=instagram;
        if(linkedin) profileFields.social.linkedin=linkedin;


        try {
            let profile = await Profile.findOne({ user: req.user.id});

            if(profile){
                // Update profile
                profile = await Profile.findOneAndUpdate(
                    { user: req.user.id},
                    { $set: profileFields},
                    { new: true}
                );

                return res.json(profile); 
            }

            // Create profile
            profile = new Profile(profileFields);

            await profile.save();
            res.json(profile);

        } catch (err) {
            console.log(err.message);
            res.status(500).send('Server Error');
        }
    }
);

module.exports = router;