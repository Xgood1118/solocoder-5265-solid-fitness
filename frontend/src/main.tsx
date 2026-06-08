/* @refresh reload */
import { render } from 'solid-js/web';
import { Router, Route } from '@solidjs/router';
import App from './App';
import Exercises from './routes/Exercises';
import ExerciseDetail from './routes/ExerciseDetail';
import Calendar from './routes/Calendar';
import Plans from './routes/Plans';
import PlanEditor from './routes/PlanEditor';
import WorkoutLogger from './routes/WorkoutLogger';
import Stats from './routes/Stats';
import Measurements from './routes/Measurements';
import './index.css';

render(
  () => (
    <Router root={App}>
      <Route path="/" component={Calendar} />
      <Route path="/exercises" component={Exercises} />
      <Route path="/exercises/:id" component={ExerciseDetail} />
      <Route path="/plans" component={Plans} />
      <Route path="/plans/new" component={PlanEditor} />
      <Route path="/plans/:id" component={PlanEditor} />
      <Route path="/workout/new" component={WorkoutLogger} />
      <Route path="/workout/:id" component={WorkoutLogger} />
      <Route path="/stats" component={Stats} />
      <Route path="/measurements" component={Measurements} />
    </Router>
  ),
  document.getElementById('root')!
);
