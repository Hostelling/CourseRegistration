import { useEffect, useState } from 'react';
import { apiFetch } from '../api.js';
import { Link } from 'react-router-dom';

export default function CourseList({ selectedId, onCourseClick }) {
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
    <>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <ul className="course-list">
        {courses.map((course) => (
          <li key={course.id} className="course-item">
            <Link
              to={`/courses/${course.id}`}
              onClick={onCourseClick}
              className={`course-link ${
                String(course.id) === String(selectedId) ? 'selected' : ''
              }`}
            >
              {course.title}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
