const colors = {
  admin: 'bg-red-100 text-red-700',
  seller: 'bg-blue-100 text-blue-700',
  viewer: 'bg-gray-100 text-gray-600',
}

const labels = {
  admin: 'Admin',
  seller: 'Vendedor',
  viewer: 'Visor',
}

export default function RoleBadge({ role }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${colors[role] ?? colors.viewer}`}>
      {labels[role] ?? role}
    </span>
  )
}
