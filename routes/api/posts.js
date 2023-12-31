const express = require('express');
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');
const router = express.Router();

const User = require('../../models/User');
const Profile = require('../../models/Profile');
const Post = require('../../models/Post');

// @route   POST api/posts
// @desc    Create a post
// @access  Private
router.post(
  '/',
  [auth, [check('text', 'Text is required').not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    try {
      const user = await User.findById(req.user.id).select('-password');

      // Create post
      const newPost = new Post({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      });

      // Save post to database
      const post = await newPost.save();

      res.json(post);
    } catch (err) {
      console.log(err.message);
      res.status(500).send('Serever Error');
    }
  }
);

// @route   Get api/posts
// @desc    Get all posts
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 });
    res.json(posts);
  } catch (err) {
    console.log(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/posts/:postId
// @desc    Get a post
// @access  Private
router.get('/:postId', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ msg: 'Post not found!' });
    }

    res.json(post);
  } catch (err) {
    console.log(err.message);

    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Post not found!' });
    }

    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/posts/:postId
// @desc    Delete a post
// @access  Private
router.delete('/:postId', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ msg: 'Post not found!' });
    }

    // Check user
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    // Delete post
    await Post.findByIdAndDelete(req.params.postId);

    res.json({ msg: 'Post deleted' });
  } catch (err) {
    console.log(err.message);

    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Post not found!' });
    }

    res.status(500).send('Server Error');
  }
});

// @route   PUT api/posts/like/:postId
// @desc    Like a post
// @access  Private
router.put('/like/:postId', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ msg: 'Post not found!' });
    }

    // Check if post has already been liked by user
    if (
      post.likes.filter((like) => like.user.toString() === req.user.id).length >
      0
    ) {
      return res.status(400).json({ msg: 'Post already liked' });
    }

    post.likes.unshift({ user: req.user.id });

    await post.save();

    res.json({ msg: 'Post liked', likes: post.likes });
  } catch (err) {
    console.log(err.message);

    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Post not found!' });
    }

    res.status(500).send('Server Error');
  }
});

// @route   PUT api/posts/unlike/:postId
// @desc    Unlike a post
// @access  Private
router.put('/unlike/:postId', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ msg: 'Post not found!' });
    }

    // Check if post is not liked by user
    if (
      post.likes.filter((like) => like.user.toString() === req.user.id)
        .length === 0
    ) {
      return res.status(400).json({ msg: 'Post has not yet been liked' });
    }

    // Get removed index
    const removeIndex = post.likes
      .map((like) => like.user.toString())
      .indexOf(req.user.id);

    post.likes.splice(removeIndex, 1);

    await post.save();

    res.json({ msg: 'Post unliked', likes: post.likes });
  } catch (err) {
    console.log(err.message);

    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Post not found!' });
    }

    res.status(500).send('Server Error');
  }
});

// @route   POST api/posts/comment/:postId
// @desc    Comment on a post
// @access  Private
router.post(
  '/comment/:postId',
  [auth, [check('text', 'Text is required').not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    try {
      const user = await User.findById(req.user.id).select('-password');
      const post = await Post.findById(req.params.postId);
      
      if (!post) {
        return res.status(404).json({ msg: 'Post not found!' });
      }

      // Create post
      const newComment = {
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      };

      post.comments.unshift(newComment);

      await post.save();

      res.json(post.comments);
    } catch (err) {
      console.log(err.message);

      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Post not found!' });
      }

      res.status(500).send('Serever Error');
    }
  }
);

// @route   DELETE api/posts/comment/:postId/:commenId
// @desc    Delete a comment on post
// @access  Private
router.delete('/comment/:postId/:commentId', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ msg: 'Post not found!' });
    }

    const comment = post.comments.find(comment=> comment.id === req.params.commentId);

    // Make sure commet exists
    if (!comment) {
      return res.status(404).json({ msg: 'Comment not found!' });
    }

    // Check user
    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    // Get removed index
    const removeIndex = post.comments
      .map((comment) => comment.user.toString())
      .indexOf(req.user.id);

    post.comments.splice(removeIndex, 1);

    // Delete comment
    await post.save();

    res.json(post.comments);
  } catch (err) {
    console.log(err.message);

    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Post not found!' });
    }

    res.status(500).send('Server Error');
  }
});

module.exports = router;
