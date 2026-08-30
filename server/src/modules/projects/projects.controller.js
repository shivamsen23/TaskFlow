const projectsService = require('./projects.service');

async function getProjects(req, res, next) {
  try {
    const { archived, search } = req.query;
    const projects = await projectsService.getProjects(req.user, { archived, search });
    res.status(200).json({ projects });
  } catch (error) {
    next(error);
  }
}

async function getProjectById(req, res, next) {
  try {
    const project = await projectsService.getProjectById(req.params.id, req.user);
    res.status(200).json({ project });
  } catch (error) {
    next(error);
  }
}

async function createProject(req, res, next) {
  try {
    const project = await projectsService.createProject(req.body, req.user);
    res.status(201).json({ project });
  } catch (error) {
    next(error);
  }
}

async function updateProject(req, res, next) {
  try {
    const project = await projectsService.updateProject(req.params.id, req.body);
    res.status(200).json({ project });
  } catch (error) {
    next(error);
  }
}

async function archiveProject(req, res, next) {
  try {
    const project = await projectsService.archiveProject(req.params.id);
    res.status(200).json({ project, message: 'Project archived successfully' });
  } catch (error) {
    next(error);
  }
}

async function restoreProject(req, res, next) {
  try {
    const project = await projectsService.restoreProject(req.params.id);
    res.status(200).json({ project, message: 'Project restored successfully' });
  } catch (error) {
    next(error);
  }
}

async function addMember(req, res, next) {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    const project = await projectsService.addMember(req.params.id, userId);
    res.status(200).json({ project, message: 'Member added successfully' });
  } catch (error) {
    next(error);
  }
}

async function removeMember(req, res, next) {
  try {
    const result = await projectsService.removeMember(req.params.id, req.params.userId, req.user);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  archiveProject,
  restoreProject,
  addMember,
  removeMember
};
