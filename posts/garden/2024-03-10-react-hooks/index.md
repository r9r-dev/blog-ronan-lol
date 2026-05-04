---
title: "React Hooks : Le Guide Complet avec Exemples Pratiques"
author: "Ronan"
date: "2024-03-10"
tags: ["React", "JavaScript", "Frontend", "Hooks"]
excerpt: "Maîtrisez les React Hooks avec ce guide complet couvrant tous les hooks essentiels et leurs cas d'usage pratiques."
growthStage: evergreen
---

Les React Hooks ont transformé la façon dont nous écrivons des composants React. Fini les classes complexes, place aux composants fonctionnels élégants et réutilisables. Découvrons ensemble comment tirer le meilleur parti de cette fonctionnalité puissante.

## Introduction aux Hooks

Les Hooks sont des fonctions qui permettent d'utiliser l'état et d'autres fonctionnalités React dans des composants fonctionnels. Introduits dans React 16.8, ils ont rapidement été adoptés par la communauté.

### Règles des Hooks

Avant de commencer, deux règles essentielles :

1. **Appelez les Hooks uniquement au niveau racine** - Pas dans des boucles, conditions ou fonctions imbriquées
2. **Appelez les Hooks uniquement depuis des fonctions React** - Composants ou custom hooks

## useState : Gérer l'état local

Le Hook le plus fondamental pour gérer l'état dans un composant fonctionnel.

```jsx
import React, { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <p>Vous avez cliqué {count} fois</p>
      <button onClick={() => setCount(count + 1)}>
        Cliquer
      </button>
    </div>
  );
}

// État avec objet
function UserProfile() {
  const [user, setUser] = useState({
    name: '',
    email: '',
    age: 0
  });
  
  const updateName = (name) => {
    setUser(prevUser => ({
      ...prevUser,
      name
    }));
  };
  
  return (
    <input 
      value={user.name}
      onChange={(e) => updateName(e.target.value)}
    />
  );
}
```

### Lazy initial state

Pour des calculs coûteux, utilisez une fonction :

```jsx
function ExpensiveComponent() {
  // calculateInitialValue n'est appelé qu'une fois
  const [state, setState] = useState(() => {
    return calculateInitialValue();
  });
}
```

## useEffect : Gérer les effets de bord

`useEffect` remplace `componentDidMount`, `componentDidUpdate` et `componentWillUnmount`.

```jsx
import React, { useState, useEffect } from 'react';

function DataFetcher({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Fonction de nettoyage
    let cancelled = false;
    
    async function fetchUser() {
      setLoading(true);
      try {
        const response = await fetch(`/api/users/${userId}`);
        const data = await response.json();
        
        if (!cancelled) {
          setUser(data);
        }
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    
    fetchUser();
    
    // Cleanup function
    return () => {
      cancelled = true;
    };
  }, [userId]); // Dépendances
  
  if (loading) return <div>Chargement...</div>;
  if (!user) return <div>Utilisateur non trouvé</div>;
  
  return <div>Bienvenue, {user.name}!</div>;
}
```

### Patterns courants avec useEffect

```jsx
// Exécuter une fois au montage
useEffect(() => {
  console.log('Composant monté');
}, []);

// Exécuter à chaque render
useEffect(() => {
  console.log('Render!');
});

// Cleanup avec event listeners
useEffect(() => {
  const handleScroll = () => console.log('Scrolling');
  window.addEventListener('scroll', handleScroll);
  
  return () => {
    window.removeEventListener('scroll', handleScroll);
  };
}, []);

// Timer avec cleanup
useEffect(() => {
  const timer = setTimeout(() => {
    console.log('Timer expiré');
  }, 1000);
  
  return () => clearTimeout(timer);
}, []);
```

## useContext : Partager des données

`useContext` simplifie l'utilisation du Context API.

```jsx
import React, { createContext, useContext, useState } from 'react';

// Créer le contexte
const ThemeContext = createContext();
const AuthContext = createContext();

// Provider component
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');
  
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };
  
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Custom hook pour utiliser le contexte
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

// Utilisation dans un composant
function ThemedButton() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <button 
      className={`btn-${theme}`}
      onClick={toggleTheme}
    >
      Mode {theme === 'light' ? 'sombre' : 'clair'}
    </button>
  );
}
```

## useReducer : État complexe

Pour une logique d'état plus complexe, `useReducer` est plus approprié que `useState`.

```jsx
import React, { useReducer } from 'react';

// Reducer function
function todoReducer(state, action) {
  switch (action.type) {
    case 'ADD_TODO':
      return {
        ...state,
        todos: [...state.todos, {
          id: Date.now(),
          text: action.payload,
          completed: false
        }]
      };
    
    case 'TOGGLE_TODO':
      return {
        ...state,
        todos: state.todos.map(todo =>
          todo.id === action.payload
            ? { ...todo, completed: !todo.completed }
            : todo
        )
      };
    
    case 'DELETE_TODO':
      return {
        ...state,
        todos: state.todos.filter(todo => todo.id !== action.payload)
      };
    
    case 'SET_FILTER':
      return {
        ...state,
        filter: action.payload
      };
    
    default:
      throw new Error(`Action non gérée: ${action.type}`);
  }
}

// Composant utilisant useReducer
function TodoApp() {
  const initialState = {
    todos: [],
    filter: 'all' // all, active, completed
  };
  
  const [state, dispatch] = useReducer(todoReducer, initialState);
  
  const addTodo = (text) => {
    dispatch({ type: 'ADD_TODO', payload: text });
  };
  
  const toggleTodo = (id) => {
    dispatch({ type: 'TOGGLE_TODO', payload: id });
  };
  
  const filteredTodos = state.todos.filter(todo => {
    if (state.filter === 'active') return !todo.completed;
    if (state.filter === 'completed') return todo.completed;
    return true;
  });
  
  return (
    <div>
      <TodoInput onAdd={addTodo} />
      <TodoFilter 
        filter={state.filter}
        onFilterChange={(filter) => 
          dispatch({ type: 'SET_FILTER', payload: filter })
        }
      />
      <TodoList 
        todos={filteredTodos}
        onToggle={toggleTodo}
      />
    </div>
  );
}
```

## useMemo et useCallback : Optimisation

Ces hooks permettent d'optimiser les performances en mémorisant des valeurs.

```jsx
import React, { useMemo, useCallback, useState } from 'react';

function ExpensiveComponent({ data, filter }) {
  // useMemo pour les calculs coûteux
  const filteredData = useMemo(() => {
    console.log('Calcul coûteux...');
    return data
      .filter(item => item.category === filter)
      .sort((a, b) => b.value - a.value)
      .slice(0, 100);
  }, [data, filter]); // Recalculé seulement si data ou filter change
  
  // useCallback pour les fonctions
  const [searchTerm, setSearchTerm] = useState('');
  
  const handleSearch = useCallback((term) => {
    console.log('Recherche pour:', term);
    // Logique de recherche complexe
    performSearch(term);
  }, []); // Fonction créée une seule fois
  
  const handleItemClick = useCallback((id) => {
    console.log('Item cliqué:', id);
    // Traitement
  }, []); // Stable entre les renders
  
  return (
    <div>
      <SearchBar onSearch={handleSearch} />
      <ItemList 
        items={filteredData}
        onItemClick={handleItemClick}
      />
    </div>
  );
}

// Exemple avec React.memo
const ItemList = React.memo(({ items, onItemClick }) => {
  console.log('ItemList render');
  return (
    <ul>
      {items.map(item => (
        <li key={item.id} onClick={() => onItemClick(item.id)}>
          {item.name}
        </li>
      ))}
    </ul>
  );
});
```

## useRef : Références et valeurs persistantes

`useRef` permet de garder une référence mutable qui persiste entre les renders.

```jsx
import React, { useRef, useEffect, useState } from 'react';

function VideoPlayer({ src }) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  return (
    <div>
      <video ref={videoRef} src={src} />
      <button onClick={togglePlay}>
        {isPlaying ? 'Pause' : 'Play'}
      </button>
    </div>
  );
}

// Garder une valeur entre les renders sans trigger de re-render
function Timer() {
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef(null);
  
  const start = () => {
    if (intervalRef.current) return;
    
    intervalRef.current = setInterval(() => {
      setSeconds(s => s + 1);
    }, 1000);
  };
  
  const stop = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };
  
  useEffect(() => {
    return () => stop(); // Cleanup
  }, []);
  
  return (
    <div>
      <p>Temps: {seconds}s</p>
      <button onClick={start}>Start</button>
      <button onClick={stop}>Stop</button>
    </div>
  );
}
```

## Custom Hooks : Réutilisabilité

Créez vos propres hooks pour encapsuler et réutiliser la logique.

```jsx
// Hook pour gérer le localStorage
function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });
  
  const setValue = (value) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(error);
    }
  };
  
  return [storedValue, setValue];
}

// Hook pour gérer les requêtes API
function useApi(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(url);
        if (!response.ok) throw new Error('Erreur réseau');
        const data = await response.json();
        setData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [url]);
  
  return { data, loading, error };
}

// Hook pour détecter les clics en dehors
function useClickOutside(handler) {
  const ref = useRef();
  
  useEffect(() => {
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) {
        return;
      }
      handler(event);
    };
    
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [handler]);
  
  return ref;
}

// Hook pour media queries
function useMediaQuery(query) {
  const [matches, setMatches] = useState(
    window.matchMedia(query).matches
  );
  
  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handler = (event) => setMatches(event.matches);
    
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);
  
  return matches;
}

// Utilisation des custom hooks
function App() {
  const [user, setUser] = useLocalStorage('user', null);
  const { data: posts, loading, error } = useApi('/api/posts');
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  const dropdownRef = useClickOutside(() => {
    console.log('Clic en dehors du dropdown');
  });
  
  return (
    <div>
      {isMobile ? <MobileView /> : <DesktopView />}
      <div ref={dropdownRef}>Dropdown menu</div>
    </div>
  );
}
```

## Hooks avancés

### useLayoutEffect

Similaire à `useEffect` mais s'exécute de manière synchrone après toutes les mutations DOM.

```jsx
function MeasureElement() {
  const [dimensions, setDimensions] = useState({});
  const elementRef = useRef();
  
  useLayoutEffect(() => {
    if (elementRef.current) {
      const { width, height } = elementRef.current.getBoundingClientRect();
      setDimensions({ width, height });
    }
  }, []);
  
  return (
    <div ref={elementRef}>
      Largeur: {dimensions.width}px, Hauteur: {dimensions.height}px
    </div>
  );
}
```

### useImperativeHandle

Personnalise la valeur de l'instance exposée lors de l'utilisation de `ref`.

```jsx
const FancyInput = React.forwardRef((props, ref) => {
  const inputRef = useRef();
  
  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current.focus();
    },
    scrollIntoView: () => {
      inputRef.current.scrollIntoView();
    }
  }));
  
  return <input ref={inputRef} {...props} />;
});

// Utilisation
function Parent() {
  const inputRef = useRef();
  
  return (
    <>
      <FancyInput ref={inputRef} />
      <button onClick={() => inputRef.current.focus()}>
        Focus Input
      </button>
    </>
  );
}
```

## Bonnes pratiques

1. **Décomposez la logique complexe** en custom hooks
2. **Utilisez ESLint** avec eslint-plugin-react-hooks
3. **Optimisez avec parcimonie** - Ne sur-optimisez pas prématurément
4. **Testez vos hooks** avec @testing-library/react-hooks
5. **Documentez vos custom hooks** pour la réutilisabilité

## Conclusion

Les React Hooks ont révolutionné le développement React en rendant les composants fonctionnels aussi puissants que les classes, tout en étant plus simples et plus composables. Maîtriser les hooks est essentiel pour tout développeur React moderne.

Pratiquez, expérimentez, et n'hésitez pas à créer vos propres hooks pour encapsuler votre logique métier !

Avez-vous des questions sur les hooks ou des patterns intéressants à partager ? Laissez un commentaire ci-dessous !