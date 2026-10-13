import { useEffect, useState } from 'react';
import { apiFetch } from '../api.js';

export default function CourseList() {
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchCourses() {
      try {
        const response = await apiFetch('/api/courses');
        setCourses(response.courses);
        setError(null);
      } catch (err) {
        setCourses([]);
        setError(err.message);
      }
    }

    fetchCourses();
  }, []);

  return (
    <ul className="course-list">
      {courses.map((course) => (
        <li key={course.id} className="course-item">
          <h3>{course.title}</h3>
          </li>
      ))}
    </ul>
  );
}
