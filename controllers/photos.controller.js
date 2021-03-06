const Photo = require("../models/photo.model");
const Voter = require("../models/Voter.model");
const requestIp = require("request-ip");

/****** SUBMIT PHOTO ********/

exports.add = async (req, res) => {
  try {
    const { title, author, email } = req.fields;

    const file = req.files.file;
    const pattern = new RegExp(
      /(<\s*(strong|em)*>(([A-z]|\s)*)<\s*\/\s*(strong|em)>)|(([A-z]|\s|\.)*)/,
      "g"
    );
    const titleMatched = title.match(pattern).join("");
    const authorMatched = author.match(pattern).join("");

    if (
      titleMatched.length < title.length &&
      authorMatched.length < author.length
    )
      throw new Error("Invalid characters...");
    const emailPattern = /\S+@\S+\.\S+/;
    const validatedEmail = emailPattern.test(email);
    if (!validatedEmail) throw new Error("Wrong email!");

    if (title && author && validatedEmail && file) {
      // if fields are not empty...

      const fileName = file.path.split("/").slice(-1)[0]; // cut only filename from full path, e.g. C:/test/abc.jpg -> abc.jpg
      const fileExt = fileName.split(".").slice(-1)[0];
      const acceptedExt = ["gif", "jpg", "png", "jpeg"];
      if (
        acceptedExt.includes(fileExt) &&
        author.length <= 50 &&
        title.length <= 25
      ) {
        const newPhoto = new Photo({
          title,
          author,
          validatedEmail,
          src: fileName,
          votes: 0,
        });
        await newPhoto.save(); // ...save new photo in DB
        res.json(newPhoto);
      } else {
        //throw new Error("Wrong file!");
        res.json("wrong file");
      }
    } else {
      throw new Error("Wrong input!");
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

/****** LOAD ALL PHOTOS ********/

exports.loadAll = async (req, res) => {
  try {
    res.json(await Photo.find());
  } catch (err) {
    res.status(500).json(err);
  }
};

/****** VOTE FOR PHOTO ********/

exports.vote = async (req, res) => {
  try {
    const photoToUpdate = await Photo.findOne({ _id: req.params.id });
    const clientIp = requestIp.getClientIp(req);
    console.log(clientIp);
    const actualVoter = await Voter.findOne({ user: clientIP });
    if (!photoToUpdate) res.status(404).json({ message: "Not found" });

    if (actualVoter) {
      if (actualVoter.votes.includes(req.params.id)) {
        res.send({ message: "You have voted already for this pic!" });
      } else {
        actualVoter.votes.push(req.params.id);
        photoToUpdate.votes++;
        await photoToUpdate.save();
        res.send({ message: "OK" });
      }
    } else {
      const newVoter = new Voter({ user: clientIP, votes: req.params.id });
      await newVoter.save();
      photoToUpdate.votes++;
      await photoToUpdate.save();
      res.send({ message: "OK" });
    }
  } catch (err) {
    res.status(500).json(err);
  }
};
