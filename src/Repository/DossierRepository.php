<?php

namespace GemeenteAmsterdam\FixxxSchuldhulp\Repository;

use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\EntityRepository;
use Doctrine\ORM\Query\Expr\Join;
use Doctrine\ORM\Tools\Pagination\Paginator;
use GemeenteAmsterdam\FixxxSchuldhulp\Entity\Gebruiker;
use GemeenteAmsterdam\FixxxSchuldhulp\Entity\DossierTimeline;
use GemeenteAmsterdam\FixxxSchuldhulp\Query\Functions\Levenshtein;

class DossierRepository extends EntityRepository
{
    public function findAll($page = 0, $pageSize = 100)
    {
        $qb = $this->createQueryBuilder('dossier');
        $qb->orderBy('dossier.aanmaakDatumTijd', 'DESC');
        $qb->setFirstResult($page * $pageSize);
        $qb->setMaxResults($pageSize);

        return new Paginator($qb->getQuery());
    }

    public function findActive($page = 0, $pageSize = 100)
    {
        $qb = $this->createQueryBuilder('dossier');
        $qb->orderBy('dossier.aanmaakDatumTijd', 'DESC');
        $qb->andWhere('dossier.inPrullenbak = :inPrullenbak');
        $qb->setParameter('inPrullenbak', false);
        $qb->setFirstResult($page * $pageSize);
        $qb->setMaxResults($pageSize);

        return new Paginator($qb->getQuery());
    }

    public function findInactive($gebruiker, $page = 0, $pageSize = 100)
    {
        $qb = $this->createQueryBuilder('dossier');
        $qb->orderBy('dossier.aanmaakDatumTijd', 'DESC');
        $qb->andWhere('dossier.inPrullenbak = :inPrullenbak');
        $qb->setParameter('inPrullenbak', true);
        if ($gebruiker->getType() === Gebruiker::TYPE_MADI) {
            $qb->andWhere('dossier.medewerkerSchuldhulpbureau = :gebruikerId');
            $qb->setParameter('gebruikerId', $gebruiker->getId());
        }
        if ($gebruiker->getType() === Gebruiker::TYPE_MADI_KEYUSER) {
            $qb->andWhere('dossier.schuldhulpbureau IN (:ghbs)');
            $qb->setParameter('ghbs', $gebruiker->getSchuldhulpbureaus());
        }
        $qb->setFirstResult($page * $pageSize);
        $qb->setMaxResults($pageSize);

        return new Paginator($qb->getQuery());
    }

    public function search($query, $page = 0, $pageSize = 100, $orderBy = 'default')
    {
        $query = array_merge([
            'naam' => null,
            'status' => [],
            'schuldhulpbureaus' => null,
            'medewerkerSchuldhulpbureau' => null,
            'teamGka' => null,
        ], $query);

        $query['naam'] = trim($query['naam']) === '' ? null : trim($query['naam']);

        $qb = $this->createQueryBuilder('dossier');
        $qb->andWhere('dossier.inPrullenbak = :inPrullenbak');
        $qb->setParameter('inPrullenbak', false);

        $qb->setFirstResult($page * $pageSize);
        $qb->setMaxResults($pageSize);

        if ($orderBy === 'default') {
            $qb->orderBy('dossier.aanmaakDatumTijd', 'DESC');
        } elseif ($orderBy === 'gka-verzenddatum') {
            $qb->leftJoin('dossier.timeline', 'timeline_verzenden_madi', Join::WITH, 'timeline_verzenden_madi.type = :timeline_verzenden_madi_type AND timeline_verzenden_madi.subtype = :timeline_verzenden_madi_subtype');
            $qb->setParameter('timeline_verzenden_madi_type', DossierTimeline::TYPE_WORKFLOW);
            $qb->setParameter('timeline_verzenden_madi_subtype', 'verzenden_madi');
            $qb->orderBy('timeline_verzenden_madi.datumtijd', 'DESC');
        }

        if ($query['naam'] !== null) {
            $qb->andWhere('FULLTEXTSEARCH(dossier.clientNaam, :searchPhrase, :searchPhrase) = TRUE');
            $qb->orWhere('LEVENSHTEIN(LOWER(dossier.clientNaam), :searchPhrase) <= :tolerance');
            $qb->orWhere('dossier.allegroNummer LIKE :searchLike');

            $qb->setParameter('searchPhrase', $query['naam']);
            $qb->setParameter('searchLike', $query['naam']. '%');
            $qb->setParameter('tolerance', Levenshtein::determineTolerance($query['naam']));
        }

        if (count($query['status']) > 0) {
            $orX = $qb->expr()->orX();
            foreach (array_values($query['status']) as $i => $status) {
                $orX->add('dossier.status = :status_' . $i);
                $qb->setParameter('status_' . $i, $status);
            }
            $qb->andWhere($orX);
        }

        if ($query['schuldhulpbureaus'] !== null && count($query['schuldhulpbureaus']) > 0) {
            $expr = $qb->expr()->orX();

            $schuldhulpbureaus = [];

            if ($query['schuldhulpbureaus'] instanceof Collection) {
                $schuldhulpbureaus = $query['schuldhulpbureaus']->toArray();
            } else if (is_array($query['schuldhulpbureaus'])) {
                $schuldhulpbureaus = $query['schuldhulpbureaus'];
            } else {
                $schuldhulpbureaus = [$query['schuldhulpbureaus']];
            }

            foreach ($schuldhulpbureaus as $i => $schuldhulpbureau) {
                $expr->add('dossier.schuldhulpbureau = :schuldhulpbureau_' . $i);
                $qb->setParameter('schuldhulpbureau_' . $i, $schuldhulpbureau);
            }
            $qb->andWhere($expr);
        }

        if (isset($query['schuldhulpbureau']) && $query['schuldhulpbureau'] !== null) {
            @trigger_error('Query for schuldhulpbureau is no longer supported', E_USER_DEPRECATED);
        }

        if ($query['medewerkerSchuldhulpbureau'] !== null) {
            $qb->andWhere('dossier.medewerkerSchuldhulpbureau = :medewerkerSchuldhulpbureau');
            $qb->setParameter('medewerkerSchuldhulpbureau', $query['medewerkerSchuldhulpbureau']);
        }
        if (!is_null($query['eersteKeerVerzondenAanGKA']) && $query['eersteKeerVerzondenAanGKA']) {
            $qb->andWhere('dossier.eersteKeerVerzondenAanGKA = :eersteKeerVerzondenAanGKA');
            $qb->setParameter('eersteKeerVerzondenAanGKA', $query['eersteKeerVerzondenAanGKA']);
        }

        if ($query['teamGka'] !== null) {
            $qb->andWhere('dossier.teamGka = :teamGka');
            $qb->setParameter('teamGka', $query['teamGka']);
        }

        return new Paginator($qb->getQuery());
    }
}
