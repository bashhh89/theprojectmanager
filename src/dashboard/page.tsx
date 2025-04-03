{projects.map((project) => (
    <a
      key={project.id}
      href={`/projects/${project.id}`}
      className="bg-zinc-900/50 border border-zinc-700 rounded-lg p-6 hover:border-zinc-600 transition-all"
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-zinc-100">{project.name}</h3>
        <span className={`px-2 py-1 text-xs rounded-full font-medium
          ${project.status === 'active' ? 'bg-green-900/30 text-green-400 border border-green-800' : 
            project.status === 'completed' ? 'bg-blue-900/30 text-blue-400 border border-blue-800' : 
            'bg-amber-900/30 text-amber-400 border border-amber-800'}
        `}>
          {project.status}
        </span>
      </div>
      
      {project.description && (
        <p className="text-zinc-400 text-sm mb-4 line-clamp-2">{project.description}</p>
      )}

      <div className="text-xs text-zinc-500">
        Last updated: {new Date(project.updated_at).toLocaleDateString()}
      </div>
    </a>
  ))} 