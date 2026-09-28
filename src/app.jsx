import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/all';

gsap. registerPlugin(ScrollTrigger); 

const app = () => {
  return (
    <main>
        <div>
            <h1 className="text-3xl text-pink">Welcome to my app</h1>
        </div>
    </main >
  )
}

export default app